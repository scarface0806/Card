/**
 * Admin order notification email.
 *
 * Sent to the business owner when a customer's payment is verified and the
 * order is marked PAID. This is an internal ops email — dense, plain, scannable
 * on a phone. It is NOT customer-facing.
 *
 * The send is awaited inside a try/catch in the payment adapter and never
 * throws. It reuses the Resend client but does NOT run through the customer
 * email pipeline (no email_log idempotency claim, no dedup). A payment replay
 * is already blocked by the compare-and-set guard in payment-adapter.ts, and
 * only the winning verify call reaches this code.
 */

import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { formatPrice } from "@/utils/formatPrice";
import { SITE_URL } from "@/lib/site-config";

import {
	getEmailFrom,
	getEmailReplyTo,
	getResendClient,
} from "./resend";

/**
 * Single, one-line change to retarget the admin notification.
 * Not in .env — a code constant so the recipient is visible and version-controlled.
 */
export const ADMIN_NOTIFICATION_EMAIL = "tapvyonfc@gmail.com";

const SEND_TIMEOUT_MS = 12_000;

/** Fields pulled from the Order row for the admin notification. */
const ADMIN_ORDER_SELECT = {
	id: true,
	orderNumber: true,
	createdAt: true,
	paidAt: true,
	cardType: true,
	productTier: true,
	price: true,
	total: true,
	paymentStatus: true,
	paymentMethod: true,
	paymentId: true,
	guestName: true,
	guestPhone: true,
	guestEmail: true,
	recipientEmail: true,
	designation: true,
	company: true,
	website: true,
	profileData: true,
	cardId: true,
	items: true,
} satisfies Prisma.OrderSelect;

type AdminOrder = Prisma.OrderGetPayload<{ select: typeof ADMIN_ORDER_SELECT }>;

interface UploadedFile {
	name: string;
	url: string | null;
}

interface SocialLink {
	name: string;
	url: string | null;
}

interface CustomerDetails {
	name: string;
	designation: string | null;
	company: string | null;
	mobile: string | null;
	email: string | null;
	website: string | null;
}

export interface AdminOrderNotificationData {
	orderId: string;
	orderNumber: string;
	createdAt: Date;
	paidAt: Date | null;
	cardDesign: string;
	productTier: string | null;
	price: string;
	paymentRef: string | null;
	paymentStatus: string;
	paymentMethod: string | null;
	customer: CustomerDetails;
	socialLinks: SocialLink[];
	profileUrl: string | null;
	uploadedFiles: UploadedFile[];
	items: Array<{ productName: string; quantity: number; price: number; total: number }>;
}

function formatIST(date: Date | null): string {
	if (!date) return "—";
	return new Date(date).toLocaleString("en-IN", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
		timeZoneName: "short",
	});
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function display(value: string | null | undefined): string {
	if (!value || !value.trim()) return "—";
	return value.trim();
}

function digitsOnly(value: string | null | undefined): string | null {
	if (!value) return null;
	const digits = value.replace(/\D/g, "");
	return digits.length > 0 ? digits : null;
}

function telLink(phone: string | null | undefined): string | null {
	const digits = digitsOnly(phone);
	if (!digits) return null;
	return `tel:+${digits}`;
}

function mailtoLink(email: string | null | undefined): string | null {
	if (!email || !email.trim()) return null;
	return `mailto:${encodeURIComponent(email.trim())}`;
}

function waLink(phone: string | null | undefined): string | null {
	const digits = digitsOnly(phone);
	if (!digits) return null;
	return `https://wa.me/${digits}`;
}

function resolveProfileUrl(cardId: string | null): string | null {
	if (!cardId) return null;
	return null;
}

function extractSocialLinks(profileData: unknown): SocialLink[] {
	if (!profileData || typeof profileData !== "object") return [];
	const data = profileData as Record<string, unknown>;
	const socialLinks = data.socialLinks as Record<string, unknown> | undefined;
	if (!socialLinks || typeof socialLinks !== "object") return [];

	const known: SocialLink[] = [];
	const entries: [string, string | null][] = [
		["Instagram", socialLinks.instagram as string | null],
		["Facebook", socialLinks.facebook as string | null],
		["LinkedIn", socialLinks.linkedin as string | null],
		["YouTube", socialLinks.youtube as string | null],
	];

	for (const [name, url] of entries) {
		if (url && typeof url === "string" && url.trim()) {
			known.push({ name, url: url.trim() });
		}
	}

	for (const [key, value] of Object.entries(socialLinks)) {
		if (
			typeof value === "string" &&
			value.trim() &&
			!entries.some(([n]) => n.toLowerCase() === key.toLowerCase())
		) {
			known.push({ name: key, url: value.trim() });
		}
	}

	return known;
}

function extractUploadedFiles(profileData: unknown): UploadedFile[] {
	if (!profileData || typeof profileData !== "object") return [];
	const data = profileData as Record<string, unknown>;
	const uploads = data.uploads as Record<string, unknown> | undefined;
	if (!uploads || typeof uploads !== "object") return [];

	const files: UploadedFile[] = [];

	for (const [key, value] of Object.entries(uploads)) {
		const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1);

		if (typeof value === "string" && value.trim()) {
			files.push({ name: fieldLabel, url: value.trim() });
		} else if (
			typeof value === "object" &&
			value !== null &&
			!("url" in value) &&
			!("name" in value)
		) {
			files.push({ name: fieldLabel, url: null });
		} else if (
			typeof value === "object" &&
			value !== null &&
			"url" in value &&
			typeof (value as { url?: unknown }).url === "string"
		) {
			files.push({
				name: fieldLabel,
				url: String((value as { url: unknown }).url).trim() || null,
			});
		}
	}

	if (files.length === 0) {
		const gallery = uploads.gallery;
		if (Array.isArray(gallery)) {
			for (const item of gallery) {
				if (typeof item === "string" && item.trim()) {
					files.push({ name: "Gallery item", url: item.trim() });
				} else if (
					typeof item === "object" &&
					item !== null &&
					typeof (item as { url?: unknown }).url === "string"
				) {
					files.push({
						name: "Gallery item",
						url: String((item as { url: string }).url).trim() || null,
					});
				}
			}
		}
	}

	return files;
}

function transformOrder(order: AdminOrder, paymentRef: string | null): AdminOrderNotificationData {
	const profileUrl = resolveProfileUrl(order.cardId);

	return {
		orderId: order.id,
		orderNumber: order.orderNumber,
		createdAt: order.createdAt,
		paidAt: order.paidAt,
		cardDesign: order.cardType || order.items[0]?.productName || "Unknown card",
		productTier: order.productTier || null,
		price: order.total ? formatPrice(order.total) : "—",
		paymentRef: paymentRef || order.paymentId || null,
		paymentStatus: order.paymentStatus || "UNKNOWN",
		paymentMethod: order.paymentMethod || null,
		customer: {
			name: order.guestName || order.recipientEmail || "Unknown",
			designation: order.designation || null,
			company: order.company || null,
			mobile: order.guestPhone || null,
			email: order.recipientEmail || order.guestEmail || null,
			website: order.website || null,
		},
		socialLinks: extractSocialLinks(order.profileData),
		profileUrl,
		uploadedFiles: extractUploadedFiles(order.profileData),
		items: (order.items || []).map((item) => ({
			productName: item.productName,
			quantity: item.quantity,
			price: item.price,
			total: item.total,
		})),
	};
}

export function adminOrderNotificationSubject(data: AdminOrderNotificationData): string {
	const name = display(data.customer.name) || "unknown";
	return `New order — ${name} — ${data.cardDesign} — ${data.price} — ${data.orderNumber}`;
}

function renderSocialLinksSection(links: SocialLink[]): string {
	if (links.length === 0) {
		return `<tr><td colspan="2" style="padding:4px 0;font-size:12px;color:#9ca3af;">—</td></tr>`;
	}
	return links
		.map(
			(link) => `
				<tr>
					<td style="padding:4px 0;font-size:12px;color:#6b7280;">${escapeHtml(link.name)}</td>
					<td style="padding:4px 0;font-size:12px;">
						<a href="${escapeHtml(link.url || "")}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${escapeHtml(link.url || "")}</a>
					</td>
				</tr>`
		)
		.join("");
}

function renderFilesSection(files: UploadedFile[]): string {
	if (files.length === 0) {
		return `<tr><td colspan="2" style="padding:4px 0;font-size:12px;color:#9ca3af;">No file references stored on the order</td></tr>`;
	}
	return files
		.map((file) => {
			const nameCell = escapeHtml(file.name);
			const urlCell = file.url
				? `<a href="${escapeHtml(file.url)}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${escapeHtml(file.url)}</a>`
				: "—";
			return `
				<tr>
					<td style="padding:4px 0;font-size:12px;color:#6b7280;">${nameCell}</td>
					<td style="padding:4px 0;font-size:12px;color:#111827;">${urlCell}</td>
				</tr>`;
		})
		.join("");
}

function renderItemsSection(items: AdminOrderNotificationData["items"]): string {
	if (items.length === 0) {
		return `<tr><td style="padding:4px 0;font-size:12px;color:#9ca3af;">—</td></tr>`;
	}
	return items
		.map((item) => {
			const name = escapeHtml(item.productName);
			const qty = item.quantity;
			const unitPrice = item.price ? formatPrice(item.price) : "—";
			const lineTotal = item.total ? formatPrice(item.total) : "—";
			return `
				<tr>
					<td style="padding:4px 0;font-size:12px;color:#111827;">${name}</td>
					<td style="padding:4px 0;font-size:12px;text-align:center;color:#111827;">×${qty}</td>
					<td style="padding:4px 0;font-size:12px;text-align:right;font-family:monospace;">${unitPrice}</td>
					<td style="padding:4px 0;font-size:12px;text-align:right;font-family:monospace;">${lineTotal}</td>
				</tr>
				<tr><td colspan="4" style="padding:0;border-top:1px solid #f3f4f6;"></td></tr>`;
		})
		.join("");
}

function buildContactLinks(customer: CustomerDetails): string {
	const links: string[] = [];
	const tel = telLink(customer.mobile);
	if (tel) {
		links.push(`<a href="${tel}" style="color:#2563eb;text-decoration:underline;">tel</a>`);
	}
	const mailt = mailtoLink(customer.email);
	if (mailt) {
		links.push(`<a href="${mailt}" style="color:#2563eb;text-decoration:underline;">mailto</a>`);
	}
	const wa = waLink(customer.mobile);
	if (wa) {
		links.push(`<a href="${wa}" style="color:#2563eb;text-decoration:underline;">wa.me</a>`);
	}
	return links.join(" · ");
}

export function buildAdminOrderNotification(
	data: AdminOrderNotificationData
): { subject: string; html: string; text: string } {
	const subject = adminOrderNotificationSubject(data);

	const orderTimestamp = formatIST(data.createdAt);
	const paidTimestamp = data.paidAt ? formatIST(data.paidAt) : "—";
	const cardDesign = display(data.cardDesign);
	const productTier = display(data.productTier);
	const price = display(data.price);
	const paymentRef = display(data.paymentRef);
	const paymentStatus = display(data.paymentStatus);
	const paymentMethod = display(data.paymentMethod);
	const profileUrl = data.profileUrl || "—";

	const name = display(data.customer.name);
	const designation = display(data.customer.designation);
	const company = display(data.customer.company);
	const mobile = display(data.customer.mobile);
	const email = display(data.customer.email);
	const website = display(data.customer.website);

	const contactLinks = buildContactLinks(data.customer);

	const socialHtml = renderSocialLinksSection(data.socialLinks);
	const filesHtml = renderFilesSection(data.uploadedFiles);
	const itemsHtml = renderItemsSection(data.items);

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#111827;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding:12px 16px;text-align:center;background:#0b1220;">
<span style="font-family:Georgia,serif;font-size:18px;font-weight:700;letter-spacing:4px;color:#ffffff;">T<span style="color:#c9b88a;">APVYO</span></span>
</td></tr>
<tr><td style="padding:16px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;">
<tr><td style="padding:0;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">

<!-- Order summary -->
<tr><td style="padding:16px 16px 8px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Order summary</td></tr>
<tr><td style="padding:8px 0 4px;font-family:monospace;font-size:11px;color:#9ca3af;">Order reference</td></tr>
<tr><td style="padding:0 0 8px;font-family:monospace;font-size:13px;font-weight:600;color:#111827;word-break:break-all;">
${escapeHtml(data.orderNumber)}
<span style="font-weight:400;color:#6b7280;">(id: ${escapeHtml(data.orderId)})</span>
</td></tr>
<tr><td style="padding:0 0 4px;border-top:1px solid #f3f4f6;"></td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Placed</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">${orderTimestamp}</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Paid</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">${paidTimestamp}</td></tr>
<tr><td style="padding:0 0 4px;border-top:1px solid #f3f4f6;"></td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Card design</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">${cardDesign} <span style="font-weight:400;color:#6b7280;">[${productTier}]</span></td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Price</td></tr>
<tr><td style="padding:0 0 8px;font-size:13px;font-weight:600;color:#111827;">${price}</td></tr>
<tr><td style="padding:0 0 4px;border-top:1px solid #f3f4f6;"></td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Payment reference</td></tr>
<tr><td style="padding:0 0 4px;font-family:monospace;font-size:12px;color:#111827;word-break:break-all;">${paymentRef}</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Payment status</td></tr>
<tr><td style="padding:0 0 0;font-size:12px;color:#111827;">${paymentStatus} <span style="font-weight:400;color:#6b7280;">[${paymentMethod}]</span></td></tr>
</table>
</td></tr>

<!-- Items -->
<tr><td style="padding:4px 16px 4px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Items</td></tr>
<tr><td style="padding:4px 0;border-top:1px solid #f3f4f6;font-family:monospace;font-size:11px;color:#9ca3af;">Product</td>
<td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;text-align:center;">Qty</td>
<td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;text-align:right;">Unit</td>
<td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;text-align:right;">Total</td></tr>
${itemsHtml}
</table>
</td></tr>

<!-- Customer details -->
<tr><td style="padding:4px 16px 4px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Customer</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Name</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;font-weight:600;color:#111827;">${name}</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Designation</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">${designation}</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Company</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">${company}</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Mobile</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">
<a href="${telLink(data.customer.mobile) || "#"}" style="color:#2563eb;text-decoration:underline;font-family:monospace;">${mobile}</a>${contactLinks ? ` <span style="color:#9ca3af;">|</span> ${contactLinks}` : ""}
</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Email</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">
<a href="${mailtoLink(data.customer.email) || "#"}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${email}</a>
</td></tr>
<tr><td style="padding:4px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Website</td></tr>
<tr><td style="padding:0 0 4px;font-size:12px;color:#111827;">${website !== "—" ? `<a href="${website.startsWith("http") ? escapeHtml(website) : "https://" + escapeHtml(website)}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${escapeHtml(website)}</a>` : "—"}</td></tr>
</table>
</td></tr>

<!-- Social links -->
<tr><td style="padding:4px 16px 4px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Social links</td></tr>
${socialHtml}
</table>
</td></tr>

<!-- Profile URL -->
<tr><td style="padding:4px 16px 4px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Profile URL</td></tr>
<tr><td style="padding:0 0 0;font-size:12px;color:#111827;word-break:break-all;">${data.profileUrl ? `<a href="${escapeHtml(data.profileUrl)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(data.profileUrl)}</a>` : "—"}</td></tr>
</table>
</td></tr>

<!-- Uploaded files -->
<tr><td style="padding:4px 16px 4px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Uploaded files</td></tr>
<tr><td style="padding:2px 0;font-family:monospace;font-size:11px;color:#9ca3af;">Filename</td>
<td style="padding:2px 0;font-family:monospace;font-size:11px;color:#9ca3af;">URL</td></tr>
${filesHtml}
</table>
</td></tr>

<tr><td style="padding:0 16px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;">
New order notification from ${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

	const text = buildPlainText(data, {
		orderTimestamp,
		paidTimestamp,
		cardDesign,
		productTier,
		price,
		paymentRef,
		paymentStatus,
		paymentMethod,
		profileUrl,
		contactLinks,
		name,
		designation,
		company,
		mobile,
		email,
		website,
	});

	return { subject, html, text };
}

function buildPlainText(
	data: AdminOrderNotificationData,
	parts: {
		orderTimestamp: string;
		paidTimestamp: string;
		cardDesign: string;
		productTier: string;
		price: string;
		paymentRef: string;
		paymentStatus: string;
		paymentMethod: string;
		profileUrl: string;
		contactLinks: string;
		name: string;
		designation: string;
		company: string;
		mobile: string;
		email: string;
		website: string;
	}
): string {
	const lines: string[] = [];

	lines.push("NEW ORDER NOTIFICATION");
	lines.push("");
	lines.push(`Subject: ${adminOrderNotificationSubject(data)}`);
	lines.push("");

	lines.push("--- Order summary ---");
	lines.push(`Order ref:    ${data.orderNumber}`);
	lines.push(`Order ID:     ${data.orderId}`);
	lines.push(`Placed:       ${parts.orderTimestamp}`);
	lines.push(`Paid:         ${parts.paidTimestamp}`);
	lines.push(`Card design:  ${parts.cardDesign} [${parts.productTier}]`);
	lines.push(`Price:        ${parts.price}`);
	lines.push(`Payment ref:  ${parts.paymentRef}`);
	lines.push(`Payment status: ${parts.paymentStatus} [${parts.paymentMethod}]`);
	lines.push("");

	lines.push("--- Items ---");
	if (data.items.length > 0) {
		for (const item of data.items) {
			const unitPrice = item.price ? formatPrice(item.price) : "—";
			const lineTotal = item.total ? formatPrice(item.total) : "—";
			lines.push(`${item.productName} ×${item.quantity}  ${unitPrice}  →  ${lineTotal}`);
		}
	} else {
		lines.push("—");
	}
	lines.push("");

	lines.push("--- Customer details ---");
	lines.push(`Name:    ${parts.name}`);
	lines.push(`Designation: ${parts.designation}`);
	lines.push(`Company: ${parts.company}`);
	lines.push(`Mobile:  ${parts.mobile}`);
	lines.push(`Email:   ${parts.email}`);
	lines.push(`Website: ${parts.website}`);

	if (data.socialLinks.length > 0) {
		lines.push("");
		lines.push("--- Social links ---");
		for (const link of data.socialLinks) {
			lines.push(`${link.name}: ${link.url}`);
		}
	} else {
		lines.push("Social links: —");
	}

	lines.push(`Profile URL: ${parts.profileUrl}`);
	lines.push("");

	lines.push("--- Uploaded files ---");
	if (data.uploadedFiles.length > 0) {
		for (const file of data.uploadedFiles) {
			lines.push(`${file.name}: ${file.url || "—"}`);
		}
	} else {
		lines.push("No file references stored on the order");
	}
	lines.push("");

	if (parts.contactLinks) {
		lines.push(`Contact: ${parts.contactLinks.replace(/<[^>]+>/g, "").trim()}`);
	}

	return lines.join("\n");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const timeout = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(
			() =>
				reject(
					new Error(
						`Admin notification send timed out after ${ms}ms - the order is unaffected.`
					)
				),
			ms
		);
	});

	return Promise.race([promise, timeout]).finally(() => {
		if (timer) clearTimeout(timer);
	}) as Promise<T>;
}

function describeError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "Unknown error";
}

/**
 * Load the order, build the admin notification, and send it via Resend.
 *
 * Never throws. Called from the payment-success path in payment-adapter.ts
 * inside a try/catch. A provider outage, DNS failure, or timeout is logged
 * server-side — the customer still gets their confirmation and a successful
 * response.
 *
 * Does NOT use the email_log idempotency pipeline — the admin alert is a
 * one-shot; payment replay is already blocked by the compare-and-set guard.
 */
export async function sendAdminOrderNotification(
	orderId: string,
	paymentRef?: string | null
): Promise<void> {
	try {
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			select: ADMIN_ORDER_SELECT,
		});

		if (!order) {
			console.error(
				`[admin-notification] order ${orderId} not found — skipping admin notification`
			);
			return;
		}

		const data = transformOrder(order, paymentRef || null);
		const { subject, html, text } = buildAdminOrderNotification(data);

		const { error } = await withTimeout(
			getResendClient().emails.send({
				from: getEmailFrom(),
				to: ADMIN_NOTIFICATION_EMAIL,
				replyTo: getEmailReplyTo(),
				subject,
				html,
				text,
			}),
			SEND_TIMEOUT_MS
		);

		if (error) {
			console.error(
				`[admin-notification] Resend rejected admin notification for order ${orderId}:`,
				JSON.stringify({
					name: error.name,
					message: error.message,
					statusCode: error.statusCode,
				})
			);
		}
	} catch (error) {
		console.error(
			`[admin-notification] order ${orderId} admin notification failed: ${describeError(error)}`
		);
	}
}
