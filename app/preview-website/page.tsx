'use client';

import { useEffect } from 'react';
import { BRAND } from '@/lib/brand';

export default function PreviewWebsitePage() {
  useEffect(() => {
    // Theme Toggle
    const themeSwitch = document.getElementById('theme-switch') as HTMLInputElement;
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('preview-theme') || 'dark';
    if (savedTheme === 'dark') {
      htmlElement.setAttribute('data-theme', 'dark');
      if (themeSwitch) themeSwitch.checked = true;
    }

    const handleThemeChange = () => {
      if (themeSwitch?.checked) {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('preview-theme', 'dark');
      } else {
        htmlElement.setAttribute('data-theme', 'light');
        localStorage.setItem('preview-theme', 'light');
      }
    };

    themeSwitch?.addEventListener('change', handleThemeChange);

    // Particle Canvas
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const particles: Array<{
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;
        color: string;
        life: number;
        decay: number;
        rotation: number;
        rotationSpeed: number;
      }> = [];

      const colors = ['#FFD700', '#FFA500', '#FF6347', '#DC143C', '#9370DB', '#8A2BE2', '#4169E1', '#1E90FF', '#00CED1'];

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const createParticles = (x: number, y: number, count = 2) => {
        for (let i = 0; i < count; i++) {
          particles.push({
            x,
            y,
            size: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 3,
            speedY: (Math.random() - 0.5) * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: Math.random() * 0.02 + 0.005,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
          });
        }
      };

      const animate = () => {
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;
            p.rotation += p.rotationSpeed;
            p.speedY += 0.02;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();

            if (p.life <= 0) {
              particles.splice(i, 1);
            }
          }

          if (particles.length > 200) {
            particles.splice(0, particles.length - 200);
          }
        }
        requestAnimationFrame(animate);
      };
      animate();

      const handleMouseMove = (e: MouseEvent) => {
        const cardContainer = document.querySelector('.digi-card-container');
        if (cardContainer) {
          const rect = cardContainer.getBoundingClientRect();
          if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            createParticles(e.clientX, e.clientY);
          }
        }
      };

      document.addEventListener('mousemove', handleMouseMove);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('mousemove', handleMouseMove);
        themeSwitch?.removeEventListener('change', handleThemeChange);
      };
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        /* ===== Font Awesome via @import (reliable in JSX style blocks) ===== */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* ===== CSS Variables — Light Theme ===== */
        :root {
          --accent: #33cc33;
          --accent-light: #ffff00;
          --accent-glow: rgba(51, 204, 51, 0.2);
          --accent-subtle: rgba(51, 204, 51, 0.1);
          --danger: #ff6b6b;
          --info: #4dabf7;
          --surface: #ffffff;
          --surface-elevated: #ffffff;
          --surface-subtle: #f8f9fc;
          --surface-muted: #f1f3f8;
          --bg-page: #eef1f6;
          --text-primary: #1a1d26;
          --text-secondary: #5c6370;
          --text-muted: #9ca3af;
          --border: rgba(0, 0, 0, 0.06);
          --border-strong: rgba(0, 0, 0, 0.1);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
          --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.08);
          --shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.1);
          --radius-sm: 10px;
          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 24px;
        }

        /* ===== Dark Theme ===== */
        [data-theme="dark"] {
          --surface: #13131f;
          --surface-elevated: #1a1a2e;
          --surface-subtle: #16162a;
          --surface-muted: #1e1e36;
          --bg-page: #0a0a14;
          --text-primary: #f0f1f5;
          --text-secondary: #8b8da3;
          --text-muted: #5c5e72;
          --border: rgba(255, 255, 255, 0.06);
          --border-strong: rgba(255, 255, 255, 0.1);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
          --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.3);
          --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.4);
          --shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.5);
        }

        /* ===== Global Reset ===== */
        *, *::before, *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ===== Scoped Preview Background ===== */
        .digi-preview-wrapper {
          background: var(--bg-page);
          padding: 24px;
          min-height: 100vh;
          transition: background 0.4s ease;
        }

        #particle-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        /* ===== Card Container ===== */
        .digi-card-container {
          max-width: 960px;
          margin: 0 auto;
          background: var(--surface);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
          position: relative;
          z-index: 1;
          transition: background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
        }

        [data-theme="dark"] .digi-card-container {
          box-shadow: 0 24px 80px rgba(0, 184, 148, 0.06), var(--shadow-xl);
        }

        /* ===== Navbar ===== */
        .digi-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          transition: background 0.4s ease, border-color 0.4s ease;
        }

        [data-theme="dark"] .digi-navbar {
          background: rgba(19, 19, 31, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .digi-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .digi-nav-logo-img {
          max-height: 40px;
          width: auto;
          object-fit: contain;
        }

        .digi-nav-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* ===== Theme Toggle ===== */
        .digi-theme-toggle { position: relative; }
        .digi-theme-switch { display: none; }
        .digi-toggle-label { cursor: pointer; display: block; }

        .digi-toggle-bg {
          width: 72px;
          height: 36px;
          background: linear-gradient(180deg, #f9d976 0%, #f39f86 50%, #e8b574 100%);
          border-radius: 36px;
          position: relative;
          overflow: hidden;
          transition: all 0.5s ease;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .digi-sun {
          position: absolute;
          width: 16px;
          height: 16px;
          background: #fff5c0;
          border-radius: 50%;
          top: 10px;
          left: 10px;
          box-shadow: 0 0 16px 6px rgba(255, 245, 192, 0.6);
          transition: all 0.5s ease;
          z-index: 1;
        }

        .digi-moon {
          position: absolute;
          width: 16px;
          height: 16px;
          background: transparent;
          border-radius: 50%;
          top: 10px;
          right: 10px;
          box-shadow: inset -5px -3px 0 0 #e8e8e8;
          opacity: 0;
          transition: all 0.5s ease;
          z-index: 1;
        }

        .digi-stars {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0; transition: all 0.5s ease;
        }
        .digi-stars span {
          position: absolute; width: 3px; height: 3px; background: #fff;
          border-radius: 50%; box-shadow: 0 0 3px 1px rgba(255,255,255,0.5);
        }
        .digi-stars span:nth-child(1) { top: 7px; right: 18px; width: 2px; height: 2px; }
        .digi-stars span:nth-child(2) { top: 14px; right: 32px; width: 3px; height: 3px; }
        .digi-stars span:nth-child(3) { top: 5px; right: 42px; width: 2px; height: 2px; }

        .digi-mountains { position: absolute; bottom: 0; left: 0; right: 0; height: 18px; }
        .digi-mountain { position: absolute; bottom: 0; width: 0; height: 0; border-style: solid; transition: all 0.5s ease; }
        .digi-mountain-1 { left: 6px; border-width: 0 10px 12px 10px; border-color: transparent transparent #d4915c transparent; }
        .digi-mountain-2 { left: 24px; border-width: 0 13px 16px 13px; border-color: transparent transparent #c47f4a transparent; }
        .digi-mountain-3 { left: 44px; border-width: 0 10px 10px 10px; border-color: transparent transparent #d4915c transparent; }

        .digi-toggle-circle {
          position: absolute; width: 28px; height: 28px; background: #ffffff;
          border-radius: 50%; top: 4px; right: 4px;
          transition: all 0.5s ease; box-shadow: 0 3px 12px rgba(0,0,0,0.2); z-index: 10;
        }

        .digi-theme-switch:checked + .digi-toggle-label .digi-toggle-bg { background: linear-gradient(180deg, #1e3a5f 0%, #2c3e50 50%, #1a252f 100%); }
        .digi-theme-switch:checked + .digi-toggle-label .digi-sun { opacity: 0; transform: translateX(-10px) scale(0); }
        .digi-theme-switch:checked + .digi-toggle-label .digi-moon { opacity: 1; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-stars { opacity: 1; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-mountain-1 { border-color: transparent transparent #4a6b8a transparent; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-mountain-2 { border-color: transparent transparent #3d5a73 transparent; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-mountain-3 { border-color: transparent transparent #4a6b8a transparent; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-toggle-circle { right: 40px; }

        /* ===== Main Content ===== */
        .digi-main-content { padding: 0; }

        /* ===== Profile Section ===== */
        .digi-profile-section {
          position: relative;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
          padding: 48px 44px;
          animation: digiSlideUp 0.6s ease-out;
          overflow: hidden;
        }

        .digi-profile-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(135deg, var(--accent-subtle), transparent 60%);
          pointer-events: none;
        }

        .digi-profile-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 3px solid var(--border);
          transition: border-color 0.4s ease;
          z-index: 1;
        }

        [data-theme="dark"] .digi-profile-image {
          border-color: rgba(0, 184, 148, 0.2);
          box-shadow: 0 12px 40px rgba(0, 184, 148, 0.1);
        }

        .digi-profile-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .digi-profile-image:hover img {
          transform: scale(1.05);
        }

        .digi-profile-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .digi-name {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
          letter-spacing: -0.02em;
          line-height: 1.2;
          transition: color 0.4s ease;
        }

        .digi-company {
          font-size: 1rem;
          font-weight: 500;
          color: var(--accent);
          margin-bottom: 24px;
          letter-spacing: 0.02em;
        }

        .digi-about-section {
          margin-bottom: 28px;
        }

        .digi-about-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .digi-about-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.75;
          transition: color 0.4s ease;
        }

        /* ===== Social Icons ===== */
        .digi-social-icons {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        .digi-social-icon {
          width: 44px;
          height: 44px;
          background: var(--surface-muted);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border);
        }

        .digi-social-icon:hover {
          background: var(--accent);
          color: #ffffff;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px var(--accent-glow);
          border-color: var(--accent);
        }

        [data-theme="dark"] .digi-social-icon {
          background: rgba(0, 184, 148, 0.08);
          color: var(--accent);
          border-color: rgba(0, 184, 148, 0.15);
        }

        [data-theme="dark"] .digi-social-icon:hover {
          background: linear-gradient(135deg, #00b894, #00cec9);
          color: #ffffff;
          box-shadow: 0 8px 30px rgba(0, 184, 148, 0.3);
          border-color: transparent;
        }

        /* ===== Works Section ===== */
        .digi-works-section {
          padding: 56px 44px;
          background: var(--surface-subtle);
          animation: digiSlideUp 0.6s ease-out 0.12s both;
          transition: background 0.4s ease;
        }

        [data-theme="dark"] .digi-works-section {
          background: var(--surface-subtle);
        }

        .digi-works-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .digi-section-badge {
          display: inline-block;
          padding: 6px 16px;
          background: var(--accent-subtle);
          color: var(--accent);
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 14px;
          border: 1px solid var(--accent-glow);
        }

        .digi-works-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
          transition: color 0.4s ease;
        }

        .digi-works-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: color 0.4s ease;
        }

        .digi-works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .digi-work-item {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 4/3;
          cursor: pointer;
          box-shadow: var(--shadow-md);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease;
        }

        .digi-work-item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .digi-work-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .digi-work-item:hover img {
          transform: scale(1.08);
        }

        .digi-work-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px 16px 16px;
          background: linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%);
          color: #fff;
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .digi-work-item:hover .digi-work-overlay {
          transform: translateY(0);
        }

        .digi-work-overlay h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 3px;
        }

        .digi-work-overlay p {
          font-size: 0.8rem;
          opacity: 0.75;
          font-weight: 400;
        }

        /* ===== Contact Form Section ===== */
        .digi-form-section {
          padding: 56px 44px;
          background: var(--surface);
          animation: digiSlideUp 0.6s ease-out 0.08s both;
          transition: background 0.4s ease;
        }

        .digi-form-header {
          text-align: center;
          margin-bottom: 44px;
        }

        .digi-form-main-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          transition: color 0.4s ease;
        }

        .digi-form-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 auto;
          transition: color 0.4s ease;
        }

        .digi-form-content {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 48px;
          align-items: start;
        }

        .digi-form-left { padding-right: 0; }

        .digi-talk-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 10px;
          transition: color 0.4s ease;
        }

        .digi-talk-text {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 32px;
          transition: color 0.4s ease;
        }

        .digi-contact-details {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .digi-contact-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .digi-detail-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: #ffffff;
          transition: transform 0.3s ease;
        }

        .digi-detail-icon:hover {
          transform: scale(1.08);
        }

        .digi-detail-icon.phone { background: linear-gradient(135deg, #33cc33, #ffff00); color: #020617; }
        .digi-detail-icon.email { background: linear-gradient(135deg, #33cc33, #ffff00); color: #020617; }
        .digi-detail-icon.location { background: linear-gradient(135deg, #33cc33, #ffff00); color: #020617; }

        .digi-phone-numbers {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .digi-contact-link {
          font-size: 0.88rem;
          color: var(--text-primary);
          line-height: 1.6;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .digi-contact-link:hover {
          color: var(--accent);
        }

        /* ===== Form Inputs ===== */
        .digi-contact-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .digi-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .digi-form-group input,
        .digi-form-group textarea {
          width: 100%;
          padding: 14px 18px;
          border: 1.5px solid var(--border-strong);
          border-radius: var(--radius-sm);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          color: var(--text-primary);
          transition: all 0.3s ease;
          background: var(--surface-subtle);
        }

        .digi-form-group input:focus,
        .digi-form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--surface);
        }

        [data-theme="dark"] .digi-form-group input,
        [data-theme="dark"] .digi-form-group textarea {
          background: var(--surface-muted);
          border-color: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        [data-theme="dark"] .digi-form-group input:focus,
        [data-theme="dark"] .digi-form-group textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.12);
          background: rgba(0, 184, 148, 0.04);
        }

        .digi-form-group input::placeholder,
        .digi-form-group textarea::placeholder {
          color: var(--text-muted);
        }

        .digi-form-group textarea {
          resize: vertical;
          min-height: 130px;
        }

        .digi-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 36px;
          background: linear-gradient(to right, #33cc33, #ffff00);
          color: #020617;
          border: none;
          border-radius: 9999px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          gap: 8px;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 14px rgba(51, 204, 51, 0.22);
        }

        .digi-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(51, 204, 51, 0.3);
        }

        .digi-submit-btn:active {
          transform: translateY(0);
        }

        /* ===== Map Section ===== */
        .digi-map-section {
          width: 100%;
          line-height: 0;
          position: relative;
        }

        .digi-map-section iframe {
          width: 100%;
          display: block;
        }

        /* ===== Footer ===== */
        .digi-footer {
          background: var(--surface-muted);
          padding: 20px 24px;
          text-align: center;
          border-top: 1px solid var(--border);
          transition: background 0.4s ease, border-color 0.4s ease;
        }

        [data-theme="dark"] .digi-footer {
          background: rgba(19, 19, 31, 0.9);
          border-top-color: rgba(255, 255, 255, 0.06);
        }

        .digi-footer-copyright {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin: 0;
          font-weight: 400;
        }

        .digi-footer-copyright .digi-brand-name {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .digi-footer-copyright .digi-brand-name:hover {
          color: var(--accent-light);
        }

        /* ===== Animation ===== */
        @keyframes digiSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== Responsive — Tablet ===== */
        @media (max-width: 768px) {
          .digi-preview-wrapper {
            padding: 12px;
          }

          .digi-card-container {
            border-radius: var(--radius-lg);
          }

          .digi-navbar {
            padding: 14px 20px;
          }

          .digi-profile-section {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 32px 24px;
          }

          .digi-profile-image {
            width: 200px;
            max-width: 100%;
            margin: 0 auto;
            border-radius: var(--radius-md);
          }

          .digi-profile-info {
            text-align: center;
          }

          .digi-name {
            font-size: 1.6rem;
          }

          .digi-about-title {
            text-align: center;
          }
          .digi-about-text {
            text-align: center;
          }

          .digi-social-icons {
            justify-content: center;
          }

          .digi-works-section {
            padding: 40px 24px;
          }

          .digi-works-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .digi-form-section {
            padding: 40px 24px;
          }

          .digi-form-content {
            grid-template-columns: 1fr;
            gap: 32px;
            display: flex;
            flex-direction: column;
          }

          .digi-form-left {
            order: 2;
            text-align: center;
          }

          .digi-form-right {
            order: 1;
            width: 100%;
          }

          .digi-form-row {
            grid-template-columns: 1fr;
          }

          .digi-contact-detail-item {
            justify-content: center;
          }
        }

        /* ===== Responsive — Mobile ===== */
        @media (max-width: 480px) {
          .digi-preview-wrapper {
            padding: 8px;
          }

          .digi-card-container {
            border-radius: var(--radius-md);
          }

          .digi-profile-section {
            padding: 24px 18px;
          }

          .digi-profile-image {
            width: 160px;
          }

          .digi-name {
            font-size: 1.35rem;
          }

          .digi-works-section {
            padding: 32px 18px;
          }

          .digi-works-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .digi-form-section {
            padding: 32px 18px;
          }

          .digi-toggle-bg {
            width: 60px;
            height: 30px;
          }

          .digi-sun { width: 13px; height: 13px; top: 8px; left: 8px; }
          .digi-moon { width: 13px; height: 13px; top: 8px; right: 8px; }
          .digi-toggle-circle { width: 24px; height: 24px; top: 3px; right: 3px; }
          .digi-theme-switch:checked + .digi-toggle-label .digi-toggle-circle { right: 33px; }
        }
      `}</style>

      <div className="frontend-dark digi-preview-wrapper">
      <canvas id="particle-canvas"></canvas>

      <div className="digi-card-container">
        {/* Navigation */}
        <nav className="digi-navbar">
          <a href="#" className="digi-logo">
            <img src={BRAND.logo} alt={BRAND.name} className="digi-nav-logo-img" />
          </a>
          <div className="digi-nav-right">
            <div className="digi-theme-toggle">
              <input type="checkbox" id="theme-switch" className="digi-theme-switch" />
              <label htmlFor="theme-switch" className="digi-toggle-label">
                <div className="digi-toggle-bg">
                  <div className="digi-sun"></div>
                  <div className="digi-moon"></div>
                  <div className="digi-stars">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="digi-mountains">
                    <div className="digi-mountain digi-mountain-1"></div>
                    <div className="digi-mountain digi-mountain-2"></div>
                    <div className="digi-mountain digi-mountain-3"></div>
                  </div>
                  <div className="digi-toggle-circle"></div>
                </div>
              </label>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="digi-main-content">
          {/* Profile Section */}
          <section className="digi-profile-section" id="about">
            <div className="digi-profile-image">
              <img
                src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop"
                alt="Tapvyo"
              />
            </div>
            <div className="digi-profile-info">
              <h1 className="digi-name">Tapvyo Admin</h1>
              <p className="digi-company">Tapvyo — NFC Digital Solutions</p>

              <div className="digi-about-section">
                <h2 className="digi-about-title">About Us</h2>
                <p className="digi-about-text">
                  Tapvyo is a modern digital solutions company specializing in NFC-powered smart business cards
                  and digital profiles. We help businesses and professionals share their identity with a single
                  tap — no apps needed. From premium NFC cards to custom digital portfolios, we craft seamless
                  experiences that make networking effortless and memorable.
                </p>
              </div>

              <div className="digi-social-icons">
                <a
                  href="https://wa.me/919876543210"
                  className="digi-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                </a>
                <a
                  href="https://www.instagram.com/tapvyo"
                  className="digi-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                >
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a
                  href="https://www.facebook.com/tapvyo"
                  className="digi-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                >
                  <i className="fa-brands fa-facebook-f"></i>
                </a>
                <a href="https://www.linkedin.com/company/tapvyo" className="digi-social-icon" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <i className="fa-brands fa-linkedin-in"></i>
                </a>
                <a href="https://tapvyo.com" className="digi-social-icon" target="_blank" rel="noopener noreferrer" title="Website">
                  <i className="fa-solid fa-globe"></i>
                </a>
              </div>
            </div>
          </section>

          {/* Our Works Section */}
          <section className="digi-works-section" id="works">
            <div className="digi-works-header">
              <span className="digi-section-badge">Portfolio</span>
              <h2 className="digi-works-title">Our Works</h2>
              <p className="digi-works-subtitle">A glimpse of our NFC cards and digital solutions</p>
            </div>
            <div className="digi-works-grid">
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop"
                  alt="NFC Business Card"
                />
                <div className="digi-work-overlay">
                  <h4>Premium NFC Card</h4>
                  <p>Matte Black Edition</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
                  alt="Digital Dashboard"
                />
                <div className="digi-work-overlay">
                  <h4>Analytics Dashboard</h4>
                  <p>Real-time Insights</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
                  alt="Digital Profile"
                />
                <div className="digi-work-overlay">
                  <h4>Digital Profile</h4>
                  <p>Custom Website</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop"
                  alt="Corporate Solution"
                />
                <div className="digi-work-overlay">
                  <h4>Corporate Solution</h4>
                  <p>Enterprise NFC</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
                  alt="Networking Event"
                />
                <div className="digi-work-overlay">
                  <h4>Event Networking</h4>
                  <p>Conference Cards</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop"
                  alt="Brand Identity"
                />
                <div className="digi-work-overlay">
                  <h4>Brand Identity</h4>
                  <p>Custom Designs</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form Section */}
          <section className="digi-form-section" id="contact">
            <div className="digi-form-header">
              <span className="digi-section-badge">Contact</span>
              <h2 className="digi-form-main-title">Get in Touch with Tapvyo</h2>
              <p className="digi-form-subtitle">
                Ready to upgrade your networking? Reach out to us and we&apos;ll help you create your perfect
                NFC digital business card.
              </p>
            </div>

            <div className="digi-form-content">
              <div className="digi-form-left">
                <h3 className="digi-talk-title">Let&apos;s build something great</h3>
                <p className="digi-talk-text">
                  Have questions about NFC cards or digital profiles? Drop us a message and our team will get back to you.
                </p>

                <div className="digi-contact-details">
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon phone">
                      <i className="fa-solid fa-phone"></i>
                    </div>
                    <div className="digi-phone-numbers">
                      <a href="tel:+919876543210" className="digi-contact-link">
                        +91 98765 43210
                      </a>
                    </div>
                  </div>
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon email">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <a href="mailto:hello@tapvyo.com" className="digi-contact-link">
                      hello@tapvyo.com
                    </a>
                  </div>
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon location">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Trichy,+Tamilnadu,+India"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="digi-contact-link"
                    >
                      Trichy, Tamilnadu,
                      <br />
                      India
                    </a>
                  </div>
                </div>
              </div>

              <div className="digi-form-right">
                <form className="digi-contact-form">
                  <div className="digi-form-row">
                    <div className="digi-form-group">
                      <input type="text" name="fullname" placeholder="Your Name" required />
                    </div>
                    <div className="digi-form-group">
                      <input type="tel" name="phone" placeholder="Phone Number" maxLength={10} required />
                    </div>
                  </div>
                  <div className="digi-form-row">
                    <div className="digi-form-group">
                      <input type="email" name="email" placeholder="Your Email" required />
                    </div>
                    <div className="digi-form-group">
                      <input type="text" name="subject" placeholder="Subject" />
                    </div>
                  </div>
                  <div className="digi-form-group">
                    <textarea name="message" placeholder="Your Message" rows={5}></textarea>
                  </div>
                  <button type="submit" className="digi-submit-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path
                        fill="currentColor"
                        d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                      ></path>
                    </svg>
                    <span>Send Message</span>
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Map Section */}
          <section className="digi-map-section">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125323.41844138754!2d78.61970684999999!3d10.804972749999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baaf50ff2aab12f%3A0xb20657c7e2b3eab9!2sTiruchirappalli%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1710744000000!5m2!1sen!2sin"
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </section>
        </main>

        {/* Footer */}
        <footer className="digi-footer">
          <p className="digi-footer-copyright">
            &copy; 2026 All Rights Reserved. Designed &amp; Developed by{' '}
            <a href="https://tapvyo.com" target="_blank" rel="noopener noreferrer" className="digi-brand-name">
              Tapvyo.
            </a>
          </p>
        </footer>
      </div>
      </div>
    </>
  );
}
