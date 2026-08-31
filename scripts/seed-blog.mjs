#!/usr/bin/env node

/**
 * Seeds two starter blog posts.
 *
 * Idempotent: each post is upserted on its slug, so re-running updates the
 * existing post rather than creating a duplicate. Views and unique views are
 * never touched, so seeding again does not reset a post's analytics.
 *
 *   node scripts/seed-blog.mjs
 *
 * Neither post carries a cover image — an accurate `alt` can only be written
 * by someone who has seen the picture. Add one per post in
 * Admin -> Blogs -> Edit -> Media before promoting the blog anywhere.
 */

import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

// Next.js reads .env.local; a bare `dotenv/config` does not, so it is named
// explicitly here. .env still loads afterwards without overriding it.
loadEnv({ path: ".env.local" });
loadEnv();

const prisma = new PrismaClient();

const AUTHOR = "Tapvyo";

/** Mirrors src/lib/blog/reading-time.ts so seeded posts match saved ones. */
function readingTimeMinutes(html) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const posts = [
  {
    slug: "what-happens-when-someone-taps-your-nfc-card",
    title: "What actually happens when someone taps your NFC card",
    excerpt:
      "No app, no pairing, no Bluetooth. Here is the exact sequence of events between a phone touching your Tapvyo card and your profile opening on their screen.",
    tags: ["nfc", "how-it-works"],
    category: "How it works",
    metaTitle: "What happens when someone taps your NFC business card",
    metaDescription:
      "A plain explanation of NFC business cards: what the chip stores, why no app is needed, and how iPhone and Android differ when you tap.",
    content: `
<p>The most common question we get about NFC business cards is also the most reasonable one: <em>what is actually happening?</em> It looks like magic, which usually means someone is about to be sold something. It is not magic. It is a very small, very old piece of technology doing one job well.</p>

<p>Here is the whole thing, start to finish.</p>

<h2>The chip has no battery</h2>

<p>Inside your Tapvyo card is a thin coil of wire and a chip smaller than a grain of rice. Neither is powered. The card has no battery, never needs charging, and will still work in ten years sitting in a drawer.</p>

<p>When a phone comes within a few centimetres, the phone's own NFC antenna emits a radio field. That field induces a current in the card's coil — the same principle as a wireless charger, at a much smaller scale — and that borrowed current is enough to wake the chip for the fraction of a second it needs.</p>

<p>This is why the tap has to be close. NFC works at roughly four centimetres. It is not Bluetooth, it is not tracking you across a room, and a card in your pocket cannot be read by someone walking past.</p>

<h2>What the chip actually stores</h2>

<p>Very little. The chip holds a short record in a format called NDEF, and for a business card that record is one thing: a web address.</p>

<p>That is genuinely all of it. Your name, your role, your phone number, your links, your photo — none of that lives on the card. The card holds a URL pointing at your Tapvyo profile, and your profile lives on the web where it can be edited.</p>

<h3>Why that matters more than it sounds</h3>

<p>Because the card stores a link rather than your details, changing your details never means reprinting anything. Change your job title on a Tuesday and every card you have ever handed out is correct on Tuesday afternoon. A printed card cannot do this, and neither can an NFC card that writes contact details directly to the chip.</p>

<h2>The tap itself</h2>

<ol>
  <li>Phone's NFC reader is listening — on modern phones this is always on in the background.</li>
  <li>Card enters the field and powers up.</li>
  <li>Chip transmits its NDEF record: the URL.</li>
  <li>Phone shows a notification with that address.</li>
  <li>Person taps the notification, and the browser opens your profile.</li>
</ol>

<p>No app installed on either side. No pairing. No account. Nothing typed. The person you just met does not need to have heard of Tapvyo.</p>

<h3>iPhone and Android behave slightly differently</h3>

<ul>
  <li><strong>iPhone (XS and later, iOS 14+)</strong> — background NFC reading is always on. Tap the card to the <em>top</em> of the phone, near the camera, with the screen unlocked. A banner slides down from the top.</li>
  <li><strong>Older iPhones (7 to X)</strong> — need NFC opened from Control Centre first, then the tap works.</li>
  <li><strong>Android</strong> — the reader is in the <em>middle</em> of the back on most handsets. NFC must be enabled in settings, which it usually is by default.</li>
</ul>

<p>If a tap does not register, the answer is almost always position rather than fault: move the card slowly across the back of the phone until it catches. Our <a href="/how-to-use">how it works guide</a> has the positions laid out per device.</p>

<h2>What happens on the other side</h2>

<p>Your profile opens as an ordinary web page. From there the person can save you to their contacts in one tap, call, message, or open whichever links you have chosen to show. They can also leave their own details, which is the part a paper card has never been able to do — you find out who took your card, instead of hoping.</p>

<h2>The security question</h2>

<p>Worth answering directly, because it comes up every time.</p>

<blockquote>
  <p>Can someone copy my card, or read it from a distance, or push something to my phone?</p>
</blockquote>

<p>The chip is read-only in normal use and holds nothing but a public web address — the same address you would happily print on a paper card. There is no personal data on the chip to steal. Reading requires physical proximity of a few centimetres. And a tap cannot install anything: it hands the phone a link, and the person decides whether to open it.</p>

<p>The honest risk with any NFC card is the same as with a QR code on a poster: you should only tap cards you were handed by someone you are talking to. That is it.</p>

<h2>So why not just use a QR code?</h2>

<p>You can, and every Tapvyo profile has one for exactly that reason — it is the fallback when a phone has no NFC, or the battery is nearly flat, or you are sharing on a video call.</p>

<p>The difference is the moment. A QR code needs the other person to open a camera, aim, and focus, which turns a handshake into a small piece of admin. A tap takes about a second, and it happens while you are still talking.</p>

<h2>The short version</h2>

<p>A coil, a chip, a URL, and a phone that already knows how to read all three. Everything interesting happens on the profile the link points at — which is the part you can change whenever you like.</p>

<p>If you want to see it working, <a href="/create-card">build your profile</a> and try it on your own phone first. It takes a few minutes and you will understand the whole thing better after one tap than after another thousand words from us.</p>
`,
  },
  {
    slug: "paper-business-cards-vs-nfc-what-changes",
    title: "Paper business cards vs NFC: what actually changes",
    excerpt:
      "Not a sales pitch. An honest look at what an NFC card fixes about paper, what it does not, and the situations where a printed card is still the better tool.",
    tags: ["business-cards", "networking", "nfc"],
    category: "Guides",
    metaTitle: "Paper vs NFC business cards: an honest comparison",
    metaDescription:
      "Where NFC business cards genuinely beat paper, where paper still wins, and how to decide which one your work actually needs.",
    content: `
<p>We sell NFC cards, so treat everything below with the scepticism that deserves. What follows is our attempt at the comparison we would want if we were on the other side of it — including the parts where paper wins.</p>

<h2>The problem with paper is not paper</h2>

<p>Printed cards are cheap, need no power, work in a basement, and cost nothing to hand out. As an object, a good letterpress card is genuinely nicer than a plastic one. The problem was never the material.</p>

<p>The problem is that a printed card is a <strong>snapshot</strong>. It is correct on the day it comes back from the printer and drifts from that moment on.</p>

<ul>
  <li>You change roles — the box is wrong.</li>
  <li>The company rebrands — the box is wrong.</li>
  <li>You move offices, change your number, add a WhatsApp line — the box is wrong.</li>
  <li>You add a portfolio, a booking link, a case study — the card was never able to carry those anyway.</li>
</ul>

<p>Most people respond by handing out cards they know are slightly wrong, and correcting it verbally. That works, and it also means the detail you corrected is the one thing the other person will not have written down.</p>

<h2>What an NFC card actually changes</h2>

<h3>1. The details stop being frozen</h3>

<p>Because the card holds a link rather than your details, you edit the profile and every card already in circulation is current. This is the whole argument, and everything else is secondary to it.</p>

<h3>2. The details arrive as data, not as text to retype</h3>

<p>A paper card has to be typed into a phone by someone who is not going to do it. Estimates vary wildly on how many printed cards are ever entered into a contact list, and we are not going to quote a number we cannot stand behind — but you already know from your own wallet that the honest answer is "not many".</p>

<p>A tapped profile offers a <em>save to contacts</em> button. The friction that kills paper cards is the retyping, and that is the friction that disappears.</p>

<h3>3. You find out who you met</h3>

<p>This is the one people underestimate. Hand over a hundred paper cards and you learn nothing. A digital profile can offer a short form — name, number, a line about what they need — so the interest that used to evaporate becomes something you can follow up on.</p>

<h3>4. One card, no reordering</h3>

<p>The recurring cost stops. Not the initial cost — an NFC card costs more than a box of paper ones up front — but the reordering does not come round again every time something changes.</p>

<h2>Where paper still wins</h2>

<p>Genuinely, in these cases:</p>

<ul>
  <li><strong>Volume drops.</strong> Leaving fifty cards in a bowl at a trade stand, or slipping one into every parcel. NFC cards cost more each; that maths does not work.</li>
  <li><strong>Somewhere to write.</strong> People still scribble on the back of a card — where you met, what you promised. A blank paper back is a real feature.</li>
  <li><strong>Rooms where phones are away.</strong> Some formal, clinical and industrial settings, and some cultures around the exchange itself, where producing a phone is the wrong move.</li>
  <li><strong>The card as an object.</strong> If a beautifully made card <em>is</em> part of the pitch — design studios, bookbinders, restaurants — the physical thing carries meaning that a tap does not.</li>
</ul>

<p>Plenty of people carry both, and that is a perfectly sensible answer. An NFC card for the conversations that matter, paper for the pile by the door.</p>

<h2>How to decide, in one question</h2>

<p>Ask what you want to happen <em>after</em> the exchange.</p>

<p>If you want the other person to have a memento of meeting you, paper is fine and always was. If you want them to have your details in their phone, and to be able to reach you a year from now when three of those details have changed, a printed card cannot deliver that and never could.</p>

<h2>What to check before you buy any NFC card</h2>

<p>Not just ours. Whoever you buy from, these are the questions worth asking:</p>

<ol>
  <li><strong>Does the profile stay free?</strong> The card is a one-off cost; the profile it points at is a service. Find out what happens in year two.</li>
  <li><strong>Can you edit it yourself?</strong> Some sellers charge per update, which reintroduces the exact problem you were escaping.</li>
  <li><strong>Does it work without an app on the recipient's phone?</strong> If they have to install something, you have made the exchange harder than paper, not easier.</li>
  <li><strong>Is there a QR fallback?</strong> For phones without NFC, and for sharing on a screen.</li>
  <li><strong>Who owns the leads?</strong> If people leave their details, make sure that list is yours.</li>
</ol>

<h2>Our position, stated plainly</h2>

<p>An NFC card is not a better business card. It is a different object that solves the one problem printed cards cannot: staying correct. If your details never change and you hand out cards by the hundred, keep printing them — you would be right to.</p>

<p>If you have ever crossed something out on a card before handing it over, that is the problem we built for. You can <a href="/create-card">set up a profile in a few minutes</a> and see whether it fits how you actually work, or <a href="/cards">look at the cards themselves</a> first.</p>
`,
  },
];

async function main() {
  console.log("Seeding blog posts…\n");

  for (const post of posts) {
    const content = sanitizeHtml(post.content, {
      allowedTags: [
        "p", "br", "hr", "h2", "h3", "h4",
        "strong", "b", "em", "i", "u", "s", "sub", "sup",
        "a", "ul", "ol", "li", "blockquote", "code", "pre",
        "img", "figure", "figcaption", "iframe",
      ],
      allowedAttributes: {
        a: ["href", "title", "target", "rel"],
        img: ["src", "alt", "title", "width", "height", "loading"],
        iframe: ["src", "title", "width", "height", "allow", "allowfullscreen"],
      },
      allowedSchemes: ["http", "https", "mailto", "tel"],
    }).trim();

    const shared = {
      title: post.title,
      excerpt: post.excerpt,
      content,
      tags: post.tags,
      category: post.category,
      authorName: AUTHOR,
      status: "PUBLISHED",
      readingTimeMinutes: readingTimeMinutes(content),
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      noindex: false,
    };

    const existing = await prisma.post.findUnique({
      where: { slug: post.slug },
      select: { id: true, publishedAt: true },
    });

    if (existing) {
      // Keep the original publish date and the accumulated view counts.
      await prisma.post.update({ where: { slug: post.slug }, data: shared });
      console.log(`  updated  /blog/${post.slug}`);
    } else {
      await prisma.post.create({
        data: { ...shared, slug: post.slug, publishedAt: new Date() },
      });
      console.log(`  created  /blog/${post.slug}`);
    }
  }

  console.log("\nDone. Add a cover image to each post in Admin -> Blogs -> Edit -> Media.");
}

main()
  .catch((error) => {
    console.error("\nBlog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
