/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Chat } from "@google/genai";

document.addEventListener('DOMContentLoaded', () => {
  // Playful name animation
  const heroH1 = document.querySelector('#hero h1') as HTMLElement;
  if (heroH1 && heroH1.textContent) {
      const text = heroH1.textContent;
      heroH1.textContent = ''; // Clear original text
      text.split('').forEach((char, index) => {
          const span = document.createElement('span');
          // Use a non-breaking space to maintain layout for space characters
          if (char === ' ') {
              span.innerHTML = '&nbsp;';
          } else {
              span.textContent = char;
          }
          // Add staggered animation delay for a playful entry
          span.style.animationDelay = `${index * 0.05}s`;
          heroH1.appendChild(span);
      });
  }

  // Smooth scrolling for anchor links in the navigation
  document.querySelectorAll('header nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (this: HTMLAnchorElement, e: Event) {
        e.preventDefault();

        const hrefAttribute = this.getAttribute('href');
        if (hrefAttribute) {
            const targetElement = document.querySelector(hrefAttribute) as HTMLElement | null;
            if (targetElement) {
                // Get header height to offset scroll position
                const header = document.querySelector('header') as HTMLElement;
                const headerHeight = header ? header.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
  });

  // Scroll-triggered fade-in animations
  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeInObserver.unobserve(entry.target);
        }
    });
  }, {
      threshold: 0.15 // Trigger when 15% of the element is visible
  });

  document.querySelectorAll('.fade-in-section').forEach(section => {
    fadeInObserver.observe(section);
  });

  // Custom cursor logic
  const cursorDot = document.querySelector('.cursor-dot') as HTMLElement;
  const cursorOutline = document.querySelector('.cursor-outline') as HTMLElement;

  // --- Particle Trail Logic ---
  let lastParticleTime = 0;
  const particleCreationInterval = 30; // ms between particles, decreased for more particles

  const createParticle = (x: number, y: number) => {
      const particle = document.createElement('div');
      particle.className = 'cursor-particle';
      document.body.appendChild(particle);

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      
      // Randomize size for a more organic feel
      const size = Math.random() * 30 + 20; // size between 20px and 50px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // Remove the particle after the animation ends to keep the DOM clean
      setTimeout(() => {
          particle.remove();
      }, 800); // This must be slightly longer than the CSS animation duration
  };

  window.addEventListener('mousemove', (e) => {
    if (cursorDot && cursorOutline) {
        // Make visible on first move
        if (cursorDot.style.opacity !== '1') {
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
        }

        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.style.left = `${posX}px`;
        cursorOutline.style.top = `${posY}px`;
        
        // Particle creation (throttled)
        const now = Date.now();
        if (now - lastParticleTime > particleCreationInterval) {
            lastParticleTime = now;
            // Don't create particles when hovering links/buttons for a cleaner UI
            if (!document.body.classList.contains('link-hovered')) {
                createParticle(posX, posY);
            }
        }
    }
  });


  // Add hover effects for interactive elements
  const interactiveElements = document.querySelectorAll(
    'a, button, .hexagon, .contact-card, .project-card a, #hero h1 span'
  );

  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
        document.body.classList.add('link-hovered');
    });
    el.addEventListener('mouseleave', () => {
        document.body.classList.remove('link-hovered');
    });
  });

  // Add click effect
  window.addEventListener('mousedown', () => {
      document.body.classList.add('cursor-down');
  });
  window.addEventListener('mouseup', () => {
      document.body.classList.remove('cursor-down');
  });

    // --- AI Chat Assistant Logic ---
    const chatFab = document.getElementById('chat-fab');
    const chatModal = document.getElementById('chat-modal');
    const chatCloseBtn = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form') as HTMLFormElement;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const chatSendBtn = document.getElementById('chat-send') as HTMLButtonElement;
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const typingIndicator = document.querySelector('.chat-typing-indicator') as HTMLElement;

    let ai: GoogleGenAI | null = null;
    let chat: Chat | null = null;
    let isChatInitialized = false;

    // Function to get page content for context
    const getPortfolioContext = (): string => {
        const aboutText = (document.getElementById('about')?.innerText || '').trim();
        const skillsText = (document.getElementById('skills')?.innerText || '').trim();
        const projectsText = (document.getElementById('projects')?.innerText || '').trim();
        return `
            ABOUT ME: ${aboutText}
            SKILLS: ${skillsText}
            PROJECTS: ${projectsText}
        `.replace(/\s+/g, ' '); // Clean up whitespace
    };

    // Initialize the chat and AI model
    const initializeChat = () => {
        if (isChatInitialized) return;
        
        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set.");
            }
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const portfolioContext = getPortfolioContext();
            const systemInstruction = `You are a friendly and professional AI assistant for Nkosinathi Mlalazi's portfolio website. Your purpose is to answer questions from visitors about Nkosinathi's skills, projects, and professional background. Use the provided portfolio content as your primary source of truth. Be conversational and helpful. Do not make up information. If a question is outside the scope of the portfolio, politely decline to answer. Here is the portfolio content: ${portfolioContext}`;
            
            chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            isChatInitialized = true;
            addBotMessage("Hello! I'm Nkosinathi's AI assistant. How can I help you today? Feel free to ask about his skills, projects, or experience.");
        } catch (error) {
            console.error("Failed to initialize AI Chat:", error);
            addBotMessage("Sorry, I'm having trouble connecting right now. Please try again later.");
            if (chatInput && chatSendBtn) {
                chatInput.disabled = true;
                chatSendBtn.disabled = true;
                chatInput.placeholder = "AI Assistant is unavailable.";
            }
        }
    };
    
    // Toggle chat visibility
    const openChat = () => {
        if (!chatModal) return;
        chatModal.classList.add('visible');
        initializeChat();
        chatInput.focus();
    };

    const closeChat = () => {
        if (!chatModal) return;
        chatModal.classList.remove('visible');
    };

    chatFab?.addEventListener('click', openChat);
    chatCloseBtn?.addEventListener('click', closeChat);
    chatModal?.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            closeChat();
        }
    });

    // Function to add a message to the UI
    const addMessageToUI = (message: string, sender: 'user' | 'bot', element?: HTMLElement): HTMLElement | null => {
        if (!chatMessagesContainer) return null;
        const messageElement = element || document.createElement('div');
        if (!element) {
            messageElement.classList.add('message', `${sender}-message`);
            chatMessagesContainer.appendChild(messageElement);
        }
        // Use textContent to prevent XSS vulnerabilities
        messageElement.textContent += message;
        
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        return messageElement;
    };

    const addBotMessage = (message: string): HTMLElement | null => {
        return addMessageToUI(message, 'bot');
    };

    const addUserMessage = (message: string) => {
        addMessageToUI(message, 'user');
    };

    // Handle form submission
    chatForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!chatInput || !chat || !chatSendBtn) return;
        
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return;

        addUserMessage(userMessage);
        chatInput.value = '';
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        typingIndicator.style.display = 'block';

        try {
            const stream = await chat.sendMessageStream({ message: userMessage });
            
            typingIndicator.style.display = 'none';
            let botMessageElement = addBotMessage(""); // Create empty bot message element

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText && botMessageElement) {
                    addMessageToUI(chunkText, 'bot', botMessageElement);
                }
            }

        } catch (error) {
            console.error("AI Chat Error:", error);
            typingIndicator.style.display = 'none';
            addBotMessage("I'm sorry, but something went wrong. Please try again.");
        } finally {
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    });
});