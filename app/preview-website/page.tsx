'use client';

import { useEffect } from 'react';

export default function PreviewWebsitePage() {
  useEffect(() => {
    // Theme Toggle
    const themeSwitch = document.getElementById('theme-switch') as HTMLInputElement;
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('preview-theme') || 'light';
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
      let particles: Array<{
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
        /* ===== CSS Variables ===== */
        :root {
          --primary-green: #00b894;
          --primary-red: #e74c3c;
          --dark-bg: #2d3436;
          --white: #ffffff;
          --light-gray: #f5f6fa;
          --gray: #636e72;
          --dark-text: #2d3436;
          --border-color: #e0e0e0;
          --card-bg: #ffffff;
          --body-bg: #f0f0f0;
          --input-bg: #ffffff;
        }

        [data-theme="dark"] {
          --white: #0d0d1a;
          --light-gray: #1a1a2e;
          --gray: #8b8b9e;
          --dark-text: #f0f0f5;
          --border-color: rgba(0, 184, 148, 0.15);
          --card-bg: #12121f;
          --body-bg: #08080f;
          --input-bg: #1a1a2e;
        }

        [data-theme="dark"] body {
          background: linear-gradient(135deg, #08080f 0%, #0d0d1a 50%, #12121f 100%);
        }

        [data-theme="dark"] .digi-card-container {
          background: linear-gradient(145deg, #12121f 0%, #1a1a2e 100%);
          box-shadow: 0 20px 60px rgba(0, 184, 148, 0.1);
          border: 1px solid rgba(0, 184, 148, 0.1);
        }

        [data-theme="dark"] .digi-navbar {
          background: rgba(18, 18, 31, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 184, 148, 0.1);
        }

        [data-theme="dark"] .digi-social-icon {
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
          border: 1px solid rgba(0, 184, 148, 0.2);
        }

        [data-theme="dark"] .digi-social-icon:hover {
          background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 184, 148, 0.3);
        }

        [data-theme="dark"] .digi-form-group input,
        [data-theme="dark"] .digi-form-group textarea {
          background: transparent;
          border: 1.5px solid rgba(0, 184, 148, 0.3);
          color: var(--dark-text);
        }

        [data-theme="dark"] .digi-form-group input:focus,
        [data-theme="dark"] .digi-form-group textarea:focus {
          border-color: #00b894;
          box-shadow: 0 0 20px rgba(0, 184, 148, 0.15);
          background: rgba(0, 184, 148, 0.03);
        }

        [data-theme="dark"] .digi-footer {
          background: rgba(18, 18, 31, 0.9);
          border-top: 1px solid rgba(0, 184, 148, 0.1);
        }

        [data-theme="dark"] .digi-works-section {
          background: rgba(26, 26, 46, 0.5);
        }

        *, *::before, *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--body-bg);
          min-height: 100vh;
          padding: 20px;
          transition: background 0.5s ease;
          overflow-x: hidden;
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

        .digi-card-container {
          max-width: 1000px;
          margin: 0 auto;
          background: var(--white);
          border-radius: 16px;
          transition: background 0.5s ease, box-shadow 0.5s ease;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
        }

        .digi-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          background: var(--white);
          border-bottom: 1px solid var(--border-color);
        }

        .digi-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .digi-nav-logo-img {
          max-height: 45px;
          width: auto;
          object-fit: contain;
        }

        .digi-nav-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .digi-theme-toggle {
          position: relative;
        }

        .digi-theme-switch {
          display: none;
        }

        .digi-toggle-label {
          cursor: pointer;
          display: block;
        }

        .digi-toggle-bg {
          width: 80px;
          height: 40px;
          background: linear-gradient(180deg, #f9d976 0%, #f39f86 50%, #e8b574 100%);
          border-radius: 40px;
          position: relative;
          overflow: hidden;
          transition: all 0.5s ease;
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .digi-sun {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #fff5c0;
          border-radius: 50%;
          top: 10px;
          left: 10px;
          box-shadow: 0 0 20px 8px rgba(255, 245, 192, 0.6);
          transition: all 0.5s ease;
          z-index: 1;
        }

        .digi-moon {
          position: absolute;
          width: 20px;
          height: 20px;
          background: transparent;
          border-radius: 50%;
          top: 10px;
          right: 10px;
          box-shadow: inset -6px -3px 0 0 #e8e8e8;
          opacity: 0;
          transition: all 0.5s ease;
          z-index: 1;
        }

        .digi-stars {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: all 0.5s ease;
        }

        .digi-stars span {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 3px 1px rgba(255, 255, 255, 0.5);
        }

        .digi-stars span:nth-child(1) { top: 8px; right: 20px; width: 2px; height: 2px; }
        .digi-stars span:nth-child(2) { top: 15px; right: 35px; width: 3px; height: 3px; }
        .digi-stars span:nth-child(3) { top: 6px; right: 45px; width: 2px; height: 2px; }

        .digi-mountains {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
        }

        .digi-mountain {
          position: absolute;
          bottom: 0;
          width: 0;
          height: 0;
          border-style: solid;
          transition: all 0.5s ease;
        }

        .digi-mountain-1 { left: 8px; border-width: 0 12px 14px 12px; border-color: transparent transparent #d4915c transparent; }
        .digi-mountain-2 { left: 28px; border-width: 0 15px 18px 15px; border-color: transparent transparent #c47f4a transparent; }
        .digi-mountain-3 { left: 50px; border-width: 0 12px 12px 12px; border-color: transparent transparent #d4915c transparent; }

        .digi-toggle-circle {
          position: absolute;
          width: 32px;
          height: 32px;
          background: #ffffff;
          border-radius: 50%;
          top: 4px;
          right: 4px;
          transition: all 0.5s ease;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.25);
          z-index: 10;
        }

        .digi-theme-switch:checked + .digi-toggle-label .digi-toggle-bg {
          background: linear-gradient(180deg, #1e3a5f 0%, #2c3e50 50%, #1a252f 100%);
        }

        .digi-theme-switch:checked + .digi-toggle-label .digi-sun {
          opacity: 0;
          transform: translateX(-10px) scale(0);
        }

        .digi-theme-switch:checked + .digi-toggle-label .digi-moon { opacity: 1; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-stars { opacity: 1; }

        .digi-theme-switch:checked + .digi-toggle-label .digi-mountain-1 { border-color: transparent transparent #4a6b8a transparent; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-mountain-2 { border-color: transparent transparent #3d5a73 transparent; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-mountain-3 { border-color: transparent transparent #4a6b8a transparent; }
        .digi-theme-switch:checked + .digi-toggle-label .digi-toggle-circle { right: 44px; }

        .digi-main-content {
          padding: 0;
        }

        .digi-profile-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding: 40px;
          border-bottom: 1px solid var(--border-color);
          animation: fadeInUp 0.5s ease-out;
        }

        .digi-profile-image {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          background: var(--light-gray);
        }

        .digi-profile-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .digi-profile-info {
          display: flex;
          flex-direction: column;
        }

        .digi-name {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--primary-green);
          margin-bottom: 5px;
        }

        .digi-company {
          font-size: 1.1rem;
          color: var(--gray);
          margin-bottom: 20px;
        }

        .digi-about-section {
          margin-bottom: 20px;
        }

        .digi-about-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--primary-red);
          margin-bottom: 12px;
        }

        .digi-about-text {
          font-size: 0.9rem;
          color: var(--gray);
          line-height: 1.7;
          text-align: justify;
        }

        .digi-social-icons {
          display: flex;
          gap: 12px;
          margin-top: auto;
        }

        .digi-social-icon {
          width: 45px;
          height: 45px;
          background: var(--light-gray);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: var(--gray);
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .digi-social-icon:hover {
          background: var(--primary-green);
          color: var(--white);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 184, 148, 0.3);
        }

        .digi-works-section {
          padding: 50px 40px;
          background: var(--light-gray);
          animation: fadeInUp 0.5s ease-out 0.15s both;
        }

        .digi-works-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .digi-works-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--dark-text);
          margin-bottom: 10px;
        }

        .digi-works-subtitle {
          font-size: 0.9rem;
          color: var(--gray);
        }

        .digi-works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .digi-work-item {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 4/3;
          cursor: pointer;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .digi-work-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .digi-work-item:hover img {
          transform: scale(1.1);
        }

        .digi-work-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          color: #fff;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }

        .digi-work-item:hover .digi-work-overlay {
          transform: translateY(0);
        }

        .digi-work-overlay h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .digi-work-overlay p {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .digi-form-section {
          padding: 50px 40px;
          background: var(--white);
          border-bottom: 1px solid var(--border-color);
          animation: fadeInUp 0.5s ease-out 0.1s both;
        }

        .digi-form-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .digi-form-main-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--dark-text);
          margin-bottom: 15px;
        }

        .digi-form-subtitle {
          font-size: 0.9rem;
          color: var(--gray);
          line-height: 1.6;
        }

        .digi-form-content {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 50px;
          align-items: start;
        }

        .digi-form-left {
          padding-right: 20px;
        }

        .digi-talk-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--dark-text);
          margin-bottom: 12px;
        }

        .digi-talk-text {
          font-size: 0.9rem;
          color: var(--gray);
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .digi-contact-details {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .digi-contact-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }

        .digi-detail-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          color: var(--white);
        }

        .digi-detail-icon.phone { background: var(--primary-green); }
        .digi-detail-icon.email { background: #3498db; }
        .digi-detail-icon.location { background: var(--primary-red); }

        .digi-phone-numbers {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .digi-contact-link {
          font-size: 0.9rem;
          color: var(--dark-text);
          line-height: 1.5;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .digi-contact-link:hover {
          color: var(--primary-green);
        }

        .digi-contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .digi-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .digi-form-group input,
        .digi-form-group textarea {
          width: 100%;
          padding: 18px 24px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.95rem;
          color: var(--dark-text);
          transition: all 0.3s ease;
          background: var(--white);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .digi-form-group input:focus,
        .digi-form-group textarea:focus {
          outline: none;
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.1);
        }

        .digi-form-group input::placeholder,
        .digi-form-group textarea::placeholder {
          color: #999;
        }

        .digi-form-group textarea {
          resize: vertical;
          min-height: 140px;
        }

        .digi-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px 40px;
          background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          gap: 8px;
        }

        .digi-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 184, 148, 0.3);
        }

        .digi-map-section {
          width: 100%;
          line-height: 0;
        }

        .digi-map-section iframe {
          width: 100%;
          display: block;
        }

        .digi-footer {
          background: var(--dark-bg);
          padding: 15px 20px;
          text-align: center;
        }

        .digi-footer-copyright {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .digi-footer-copyright .digi-brand-name {
          color: var(--primary-green);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .digi-footer-copyright .digi-brand-name:hover {
          color: #00cec9;
          text-decoration: underline;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          body {
            padding: 10px;
          }

          .digi-profile-section {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 20px;
          }

          .digi-profile-image {
            width: 85%;
            max-width: 350px;
            margin: 0 auto;
          }

          .digi-name {
            font-size: 1.5rem;
            text-align: center;
          }

          .digi-company {
            text-align: center;
          }

          .digi-about-section,
          .digi-about-title,
          .digi-about-text {
            text-align: center;
          }

          .digi-social-icons {
            justify-content: center;
          }

          .digi-form-section {
            padding: 30px 20px;
          }

          .digi-form-content {
            grid-template-columns: 1fr;
            gap: 30px;
            display: flex;
            flex-direction: column;
          }

          .digi-form-left {
            padding-right: 0;
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

          .digi-works-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
        }

        @media (max-width: 480px) {
          .digi-works-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <canvas id="particle-canvas"></canvas>

      <div className="digi-card-container">
        {/* Navigation */}
        <nav className="digi-navbar">
          <a href="#" className="digi-logo">
            <img
              src="https://storage.googleapis.com/msgsndr/8ngdqoFUXXm1PXlT81Pt/media/6838cb53f2065c82e0a8b3e7.png"
              alt="Logo"
              className="digi-nav-logo-img"
            />
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
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
                alt="Prabhakaran N"
              />
            </div>
            <div className="digi-profile-info">
              <h1 className="digi-name">Prabhakaran N</h1>
              <p className="digi-company">Velan Roofings</p>

              <div className="digi-about-section">
                <h2 className="digi-about-title">About Us</h2>
                <p className="digi-about-text">
                  We are Trichy&apos;s most trusted roofing experts dedicated to helping you build your dream roof.
                  Serving since 2011, Velan Roofings has successfully completed 500+ projects with 300+ happy
                  customers. Our team specializes in factory sheds, Kerala model roofs, farmhouse roofing, and custom
                  designs that bring your vision to life with precision and quality craftsmanship.
                </p>
              </div>

              <div className="digi-social-icons">
                <a
                  href="https://wa.me/918610130884"
                  className="digi-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                >
                  <i className="fab fa-whatsapp"></i>
                </a>
                <a
                  href="https://www.instagram.com/velanroofings_6622"
                  className="digi-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=100084313391893"
                  className="digi-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="digi-social-icon" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
          </section>

          {/* Our Works Section */}
          <section className="digi-works-section" id="works">
            <div className="digi-works-header">
              <h2 className="digi-works-title">Our Works</h2>
              <p className="digi-works-subtitle">Take a look at some of our completed roofing projects</p>
            </div>
            <div className="digi-works-grid">
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&h=300&fit=crop"
                  alt="Factory Shed"
                />
                <div className="digi-work-overlay">
                  <h4>Factory Shed</h4>
                  <p>Industrial Roofing</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop"
                  alt="Kerala Model Roof"
                />
                <div className="digi-work-overlay">
                  <h4>Kerala Model</h4>
                  <p>Residential Roofing</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop"
                  alt="Modern Villa"
                />
                <div className="digi-work-overlay">
                  <h4>Modern Villa</h4>
                  <p>Premium Roofing</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
                  alt="Farmhouse"
                />
                <div className="digi-work-overlay">
                  <h4>Farmhouse</h4>
                  <p>Rural Roofing</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
                  alt="Commercial Building"
                />
                <div className="digi-work-overlay">
                  <h4>Commercial</h4>
                  <p>Office Building</p>
                </div>
              </div>
              <div className="digi-work-item">
                <img
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"
                  alt="Custom Design"
                />
                <div className="digi-work-overlay">
                  <h4>Custom Design</h4>
                  <p>Unique Roofing</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form Section */}
          <section className="digi-form-section" id="contact">
            <div className="digi-form-header">
              <h2 className="digi-form-main-title">We are ready to Help You</h2>
              <p className="digi-form-subtitle">
                Please feel free to get in touch using the form below, we are ready to hear your thoughts &amp; answer
                any questions you may have!
              </p>
            </div>

            <div className="digi-form-content">
              <div className="digi-form-left">
                <h3 className="digi-talk-title">Let&apos;s talk with us</h3>
                <p className="digi-talk-text">
                  Questions, comments, or suggestions? Simply fill in the form and we&apos;ll be in touch shortly.
                </p>

                <div className="digi-contact-details">
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon phone">
                      <i className="fas fa-phone-alt"></i>
                    </div>
                    <div className="digi-phone-numbers">
                      <a href="tel:+917502446622" className="digi-contact-link">
                        +91 750 244 6622
                      </a>
                      <a href="tel:+918610130884" className="digi-contact-link">
                        +91 861 013 0884
                      </a>
                    </div>
                  </div>
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon email">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <a href="mailto:velanroofing6622@gmail.com" className="digi-contact-link">
                      velanroofing6622@gmail.com
                    </a>
                  </div>
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon location">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <a
                      href="https://maps.google.com/?q=53,+Koil+Street,+Beemanagar,+Trichy+-+620001,+Tamilnadu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="digi-contact-link"
                    >
                      53, Koil Street, Beemanagar,
                      <br />
                      Trichy - 620001, Tamilnadu
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path
                        fill="currentColor"
                        d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                      ></path>
                    </svg>
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Map Section */}
          <section className="digi-map-section">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0!2d78.7047!3d10.7905!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ3JzI2LjAiTiA3OMKwNDInMTcuMCJF!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin"
              width="100%"
              height="350"
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
    </>
  );
}
