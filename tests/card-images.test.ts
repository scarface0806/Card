import { describe, expect, it } from "vitest";

import { resolveCardBackImage } from "@/lib/cardImages";
import { descriptionLines } from "@/lib/products/presentation";

describe("resolveCardBackImage", () => {
  it("prefers a real back-image field over the naming convention", () => {
    expect(
      resolveCardBackImage("/cards/elegant.png", "/cards/custom-reverse.png")
    ).toBe("/cards/custom-reverse.png");
  });

  it("inserts -back before the extension", () => {
    expect(resolveCardBackImage("/cards/elegant.png")).toBe(
      "/cards/elegant-back.png"
    );
  });

  it("appends -back when the URL has no extension", () => {
    expect(
      resolveCardBackImage("https://res.cloudinary.com/x/image/upload/v1/admin/products/kx8f2mq")
    ).toBe("https://res.cloudinary.com/x/image/upload/v1/admin/products/kx8f2mq-back");
  });

  it("preserves query strings and hashes", () => {
    expect(resolveCardBackImage("/cards/elegant.png?v=2")).toBe(
      "/cards/elegant-back.png?v=2"
    );
  });

  it("returns null for a card with no front image", () => {
    expect(resolveCardBackImage(undefined)).toBeNull();
    expect(resolveCardBackImage("")).toBeNull();
    expect(resolveCardBackImage("   ")).toBeNull();
  });

  it("refuses to derive a sibling for inline and object URLs", () => {
    // Appending -back to a base64 payload produced a guaranteed-broken URL,
    // which is how the flip control got offered for cards with no back face.
    expect(resolveCardBackImage("data:image/png;base64,iVBORw0KGgo=")).toBeNull();
    expect(resolveCardBackImage("blob:http://localhost/abc-123")).toBeNull();
  });

  it("does not derive a back face from a back face", () => {
    expect(resolveCardBackImage("/cards/elegant-back.png")).toBeNull();
  });
});

describe("descriptionLines", () => {
  it("splits a newline-separated description into its lines", () => {
    // The exact shape of the reported bug: four features entered in the admin
    // textarea, collapsed into one sentence by rendering them inside a <p>.
    const stored =
      "Premium Digital Profile\nDirect Contact Form Access\nGoogle Maps Location\nInstant WhatsApp Enquiry";

    expect(descriptionLines(stored)).toEqual([
      "Premium Digital Profile",
      "Direct Contact Form Access",
      "Google Maps Location",
      "Instant WhatsApp Enquiry",
    ]);
  });

  it("leaves a genuine sentence as a single entry", () => {
    expect(
      descriptionLines("A premium metal card for professionals, built to last.")
    ).toEqual(["A premium metal card for professionals, built to last."]);
  });

  it("splits on bullet characters when there are no newlines", () => {
    expect(descriptionLines("Metal finish • NFC chip • QR code")).toEqual([
      "Metal finish",
      "NFC chip",
      "QR code",
    ]);
  });

  it("strips leading list markers so bullets are not doubled", () => {
    expect(descriptionLines("- Metal finish\n* NFC chip\n• QR code")).toEqual([
      "Metal finish",
      "NFC chip",
      "QR code",
    ]);
  });

  it("returns nothing for an empty description", () => {
    expect(descriptionLines(undefined)).toEqual([]);
    expect(descriptionLines(null)).toEqual([]);
    expect(descriptionLines("   ")).toEqual([]);
  });
});
