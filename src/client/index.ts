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
      }
    });
  });

  // Add iframe button event listener
  const addIframeBtn = document.getElementById("add-iframe-btn");
  addIframeBtn?.addEventListener("click", addNewIframe);

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

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createLayout);
} else {
  createLayout();
}
