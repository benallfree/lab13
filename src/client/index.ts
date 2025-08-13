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
        <h2>Demos</h2>
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
          <button class="edit-sandbox-btn" id="edit-sandbox-btn" style="display: none;">
            <span>🚀</span>
            <span>Edit in CodeSandbox</span>
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

        // Show edit sandbox button
        const editSandboxBtn = document.getElementById("edit-sandbox-btn");
        if (editSandboxBtn) {
          editSandboxBtn.style.display = "block";
        }
      }
    });
  });

  // Add iframe button event listener
  const addIframeBtn = document.getElementById("add-iframe-btn");
  addIframeBtn?.addEventListener("click", addNewIframe);

  // Add CodeSandbox button event listener
  const editSandboxBtn = document.getElementById("edit-sandbox-btn");
  editSandboxBtn?.addEventListener("click", createCodeSandbox);

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

  // Show edit sandbox button
  const editSandboxBtn = document.getElementById("edit-sandbox-btn");
  if (editSandboxBtn) {
    editSandboxBtn.style.display = "block";
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

async function createCodeSandbox() {
  if (!currentDemo) {
    console.error("No demo selected");
    return;
  }

  try {
    // Fetch the current demo content
    const response = await fetch(`/demos/${currentDemo}`);
    const htmlContent = await response.text();

    // Create sandbox using the correct POST method
    const sandboxResponse = await fetch(
      "https://codesandbox.io/api/v1/sandboxes/define",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: {
            "index.html": {
              content: htmlContent,
            },
            "package.json": {
              content: {
                name: "paint-demo",
                version: "1.0.0",
                description: "Paint Demo from JS13K MMO Demo Series",
                main: "index.html",
                dependencies: {},
              },
            },
          },
        }),
      }
    );

    if (sandboxResponse.ok) {
      const result = await sandboxResponse.json();
      // Open the sandbox in a new tab
      window.open(`https://codesandbox.io/s/${result.sandbox_id}`, "_blank");
      console.log("Sandbox created successfully:", result.sandbox_id);
    } else {
      console.error("Failed to create CodeSandbox:", sandboxResponse.status);
      // Fallback: open a new sandbox and let user paste the content
      window.open("https://codesandbox.io/s/new?file=index.html", "_blank");
    }
  } catch (error) {
    console.error("Error creating CodeSandbox:", error);
    // Fallback: open a new sandbox and let user paste the content
    window.open("https://codesandbox.io/s/new?file=index.html", "_blank");
  }
}
