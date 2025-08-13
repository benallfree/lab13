import "./normalize.css";
import "./styles.css";

// Demo data
const demos = [
  {
    name: "Paint Demo",
    filename: "paint.html",
    description: "JS13K MMO Demo Series - Paint Demo",
  },
  {
    name: "Cars Demo",
    filename: "cars.html",
    description: "JS13K MMO Demo Series - Cars Demo",
  },
  {
    name: "Flight Simulator",
    filename: "flight.html",
    description: "JS13K MMO Demo Series - Flight Simulator",
  },
];

// Track current demo and iframe count
let currentDemo = "";
let iframeCount = 1;

// Create the main layout
function createLayout() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <h2>JS13K MMO Demo Series</h2>
        <nav class="demo-nav">
          ${demos
            .map(
              (demo) => `
            <button class="demo-item" data-demo="${demo.filename}">
              <h3>${demo.name}</h3>
              <p>${demo.description}</p>
            </button>
          `
            )
            .join("")}
        </nav>
      </aside>
      <main class="main-content">
        <div class="main-header">
          <button
            class="view-github-btn"
            id="view-github-btn"
            style="
              display: none;
              flex-direction: row;
              align-items: center;
              gap: 6px;
              background: #f5f6fa;
              color: #222;
              border: 1px solid #e0e0e0;
              border-radius: 5px;
              padding: 5px 12px;
              font-size: 15px;
              font-family: inherit;
              cursor: pointer;
              box-shadow: 0 1px 2px rgba(0,0,0,0.04);
              transition: background 0.15s, border 0.15s;
            "
            onmouseover="this.style.background='#e9ecef';this.style.borderColor='#cfd8dc'"
            onmouseout="this.style.background='#f5f6fa';this.style.borderColor='#e0e0e0'"
          >
            <span style="width: 18px; height: 18px; display: inline-flex; align-items: center; top: 3px; position: relative;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </span>
            <span style="display: inline-flex; align-items: center; height: 18px;">Source</span>
          </button>
        </div>
        <div class="iframes-container" id="iframes-container">
          <div class="iframe-container">
            <iframe class="demo-iframe" src="" width="640" height="400" frameborder="0"></iframe>
          </div>
        </div>
        <button class="add-iframe-btn" id="add-iframe-btn">
          <span>+</span>
          <span>Add Demo Instance</span>
        </button>
      </main>
    </div>
  `;

  // Add event listeners
  const demoButtons = document.querySelectorAll(".demo-item");
  demoButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filename = button.getAttribute("data-demo");
      if (filename) {
        loadDemo(filename);

        // Update active state
        demoButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Show GitHub button
        const viewGithubBtn = document.getElementById("view-github-btn");
        if (viewGithubBtn) {
          viewGithubBtn.style.display = "block";
        }
      }
    });
  });

  // Add iframe button event listener
  const addIframeBtn = document.getElementById("add-iframe-btn");
  addIframeBtn?.addEventListener("click", addNewIframe);

  // Add GitHub button event listener
  const viewGithubBtn = document.getElementById("view-github-btn");
  viewGithubBtn?.addEventListener("click", viewOnGithub);

  // Load first demo by default
  if (demos.length > 0) {
    loadDemo(demos[0].filename);
    demoButtons[0]?.classList.add("active");
  }
}

function loadDemo(filename: string) {
  currentDemo = filename;
  iframeCount = 1;

  // Clear existing iframes and create one new one
  const container = document.getElementById("iframes-container");
  if (container) {
    container.innerHTML = `
      <div class="iframe-container">
        <iframe class="demo-iframe" src="/demos/${filename}" width="640" height="400" frameborder="0"></iframe>
      </div>
    `;
  }

  // Show GitHub button
  const viewGithubBtn = document.getElementById("view-github-btn");
  if (viewGithubBtn) {
    viewGithubBtn.style.display = "block";
  }
}

function addNewIframe() {
  if (!currentDemo) return;

  iframeCount++;
  const container = document.getElementById("iframes-container");
  if (container) {
    const newIframe = document.createElement("div");
    newIframe.className = "iframe-container";
    newIframe.innerHTML = `
      <iframe class="demo-iframe" src="/demos/${currentDemo}" width="640" height="400" frameborder="0"></iframe>
    `;
    container.appendChild(newIframe);
  }
}

function viewOnGithub() {
  if (!currentDemo) return;
  window.open(
    `https://github.com/benallfree/js13k-mmo/tree/main/public/demos/${currentDemo}`,
    "_blank"
  );
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createLayout);
} else {
  createLayout();
}
