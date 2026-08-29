'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * A next/link that accepts Framer Motion props.
 *
 * Use this instead of wrapping a <button> in a <Link>. That pattern nests a
 * button inside an anchor, which is invalid HTML and gives assistive tech two
 * overlapping controls for one action - and it collapses the anchor's own box
 * to the height of its text, so the link reports a 20px tap target even though
 * the button inside it is full size.
 */
const MotionLink = motion.create(Link);

export default MotionLink;
