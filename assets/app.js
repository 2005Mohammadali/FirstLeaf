async function fetchContributors() {
  const elList = document.getElementById("contributors");
  const elCount = document.getElementById("count");
  const elLoading = document.getElementById("loading");
  const elError = document.getElementById("error");
  const sortSelect = document.getElementById("sortSelect");
  const elSpotlight = document.getElementById("spotlight");
  const elShowAnother = document.getElementById("show-another");

  let contributors = [];
  let lastSpotlightIndex = -1;

  // Resolve repo URL automatically on GitHub Pages, or use a provided override
  function detectRepoUrl() {
    try {
      if (location.hostname.endsWith("github.io")) {
        const owner = location.hostname.split(".")[0];
        const parts = location.pathname.split("/").filter(Boolean);
        const repo = parts[0] || "firstleaf";
        return `https://github.com/${owner}/${repo}`;
      }
    } catch {}
    return (window.SICKSTICKS && window.SICKSTICKS.repoUrl) || "";
  }

  const resolvedRepoUrl = detectRepoUrl();
  const repoLink = document.getElementById("repoLink");
  if (repoLink && resolvedRepoUrl) {
    repoLink.href = resolvedRepoUrl;
  } else if (repoLink) {
    repoLink.remove();
  }

  function showSpotlight() {
    if (contributors.length === 0) return;

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * contributors.length);
    } while (contributors.length > 1 && randomIndex === lastSpotlightIndex);

    lastSpotlightIndex = randomIndex;
    const person = contributors[randomIndex];

    elSpotlight.innerHTML = `
      <img src="${
        person.avatar ||
        `https://avatars.githubusercontent.com/${person.username || ""}`
      }" alt="${person.name || person.username || "Contributor"} avatar">
      <div class="name">${person.name || "Anonymous"}</div>
      <div class="username">@${person.username || ""}</div>
      <div class="message">"${person.message || "No message"}"</div>
    `;
  }

  try {
    const res = await fetch("./data/contributors.ndjson", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Network error");
    const text = await res.text();
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const people = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    function sortContributors(contributors, sortType) {
      const sorted = [...contributors];
      switch (sortType) {
        case "newest":
          sorted.sort(
            (a, b) =>
              (b.addedAt || "").localeCompare(a.addedAt || "") ||
              (a.name || "").localeCompare(b.name || "")
          );
          break;
        case "oldest":
          sorted.sort(
            (a, b) =>
              (a.addedAt || "").localeCompare(b.addedAt || "") ||
              (a.name || "").localeCompare(b.name || "")
          );
          break;
        case "name-asc":
          sorted.sort((a, b) =>
            (a.name || a.username || "").localeCompare(
              b.name || b.username || ""
            )
          );
          break;
        case "name-desc":
          sorted.sort((a, b) =>
            (b.name || b.username || "").localeCompare(
              a.name || b.username || ""
            )
          );
          break;
        default:
          sorted.sort(
            (a, b) =>
              (b.addedAt || "").localeCompare(a.addedAt || "") ||
              (a.name || "").localeCompare(b.name || "")
          );
      }
      return sorted;
    }

    function renderContributors(contributors) {
      elList.innerHTML = "";
      const contributorElements = [];

      // Find the newest contributor once (based on addedAt)
      const newestContributor = contributors.reduce((latest, curr) => {
        if (!latest) return curr;
        if ((curr.addedAt || "") > (latest.addedAt || "")) {
          return curr;
        }
        return latest;
      }, null);

      for (let i = 0; i < contributors.length; i++) {
        const p = contributors[i];
        const a = document.createElement("a");
        const profileUrl =
          p.github || (p.username ? `https://github.com/${p.username}` : "#");
        a.href = profileUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute('aria-label', `Open ${p.name || p.username || "contributor"} on GitHub`);

        const card = document.createElement("div");
        card.className = "card";
        card.role = "listitem";

        // Create appreciation bar
        const appreciationBar = document.createElement("div");
        appreciationBar.className = "appreciation-bar";

        // Add appreciation buttons
        const appreciationTypes = [
          { type: "clap", emoji: "👏" },
          { type: "heart", emoji: "❤️" },
          { type: "party", emoji: "🎉" },
          { type: "thanks", emoji: "🙏" },
          { type: "star", emoji: "⭐" }
        ];

        appreciationTypes.forEach(appType => {
          const btn = document.createElement("button");
          btn.className = "appreciation-btn";
          btn.setAttribute("data-type", appType.type);
          btn.setAttribute("data-username", p.username || "");
          btn.setAttribute("aria-label", `Send ${appType.type} appreciation`);
          btn.title = "Send appreciation";

          const emoji = document.createElement("span");
          emoji.className = "emoji";
          emoji.textContent = appType.emoji;

          const count = document.createElement("span");
          count.className = "count";
          count.textContent = "0";

          btn.appendChild(emoji);
          btn.appendChild(count);
          appreciationBar.appendChild(btn);
        });

        // Add total appreciation count
        const totalAppreciation = document.createElement("div");
        totalAppreciation.className = "total-appreciation";
        totalAppreciation.textContent = "Total: 0 appreciations";
        appreciationBar.appendChild(totalAppreciation);

        if (newestContributor && p.username === newestContributor.username) {
          const badge = document.createElement("span");
          badge.className = "new-badge";
          badge.textContent = "NEW";
          card.appendChild(badge);
        }

        const top = document.createElement("div");
        top.className = "top";

        const img = document.createElement("img");
        img.src =
          p.avatar ||
          `https://avatars.githubusercontent.com/${p.username || ""}`;
        img.alt = `${p.name || p.username || "Contributor"} avatar`;
        img.loading = "lazy";

        const info = document.createElement("div");
        const name = document.createElement("div");
        name.className = "name";
        name.textContent = p.name || "Anonymous";

        const username = document.createElement("div");
        username.className = "username";
        username.textContent = p.username ? `@${p.username}` : "";

        info.appendChild(name);
        info.appendChild(username);

        top.appendChild(img);
        top.appendChild(info);

        // Add badges if they exist
        if (p.badges && Array.isArray(p.badges)) {
          const badgesContainer = document.createElement('div');
          badgesContainer.className = 'badges';
          
          p.badges.forEach(badge => {
            let badgeInfo;
            let badgeClass;

            if (typeof badge === 'string') {
              // Predefined badge
              badgeInfo = badgeIcons[badge];
              badgeClass = `badge-${badge}`;
            } else if (badge && badge.type === 'custom') {
              // Custom badge
              badgeInfo = {
                icon: '', // No icon for custom badges, or define a default
                label: badge.text || 'Custom',
                color: badge.color || '#ffffff'
              };
              badgeClass = 'badge-custom';
            }

            if (badgeInfo) {
              const badgeEl = document.createElement('span');
              badgeEl.className = `badge ${badgeClass}`;
              badgeEl.textContent = `${badgeInfo.icon ? badgeInfo.icon + ' ' : ''}${badgeInfo.label}`;
              badgeEl.title = badgeInfo.label;
              if (badgeInfo.color && badgeClass === 'badge-custom') {
                badgeEl.style.background = badgeInfo.color;
              }
              badgesContainer.appendChild(badgeEl);
            }
          });

          if (badgesContainer.children.length > 0) {
            card.appendChild(badgesContainer);
          }
        }

        const meta = document.createElement("div");
        meta.className = "meta";
        if (p.message) meta.textContent = p.message;

        card.appendChild(top);
        if (p.message) card.appendChild(meta);
        card.appendChild(appreciationBar);

        // Append card to link, then add to DOM
        a.appendChild(card);
        elList.appendChild(a);

        // Initialize appreciation data for this contributor
        initAppreciationForContributor(p.username || "", appreciationBar);

        // Add animation class and index after insertion so animations reliably run
        (function(el, idx){
          requestAnimationFrame(() => {
            el.style.setProperty("--card-index", String(idx));
            el.classList.add('contributor-link');
          });
        })(a, i);

        contributorElements.push({
          element: a,
          name: (p.name || "").toLowerCase(),
          username: (p.username || "").toLowerCase(),
          badges: p.badges || [],
        });
      }

      return contributorElements;
    }
    
    contributors = people;
    let sortedPeople = sortContributors(people, "newest");
    let contributorElements = renderContributors(sortedPeople);

    // Search functionality
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        applyFiltersAndSearch(searchTerm);
      });
    }

    // Badge filter functionality
    const badgeFilters = document.getElementById("badgeFilters");
    const filterCount = document.getElementById("filterCount");
    let activeFilter = "all";

    if (badgeFilters) {
      badgeFilters.addEventListener("click", (e) => {
        if (e.target.classList.contains("badge-filter")) {
          // Remove active class from all filters
          document.querySelectorAll(".badge-filter").forEach(filter => {
            filter.classList.remove("active");
          });

          // If clicking the active filter, deactivate it
          if (activeFilter === e.target.dataset.badge) {
            activeFilter = "all";
            document.querySelector('.badge-filter[data-badge="all"]').classList.add("active");
          } else {
            // Add active class to clicked filter
            e.target.classList.add("active");
            activeFilter = e.target.dataset.badge;
          }

          // Apply filters
          const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
          applyFiltersAndSearch(searchTerm);
        }
      });
    }

    // Function to apply both search and badge filters
    function applyFiltersAndSearch(searchTerm) {
      let visibleCount = 0;

      contributorElements.forEach(({ element, name, username, badges }) => {
        let matchesSearch = !searchTerm || name.includes(searchTerm) || username.includes(searchTerm);
        let matchesBadge = activeFilter === "all" || (badges && badges.includes(activeFilter));

        if (matchesSearch && matchesBadge) {
          element.style.display = "";
          visibleCount++;
        } else {
          element.style.display = "none";
        }
      });

      // Update count
      if (filterCount) {
        if (activeFilter === "all") {
          filterCount.textContent = searchTerm ? 
            `${visibleCount} of ${people.length} contributors match search` : 
            `Showing all ${people.length} contributors`;
        } else {
          const badgeLabel = document.querySelector(`.badge-filter[data-badge="${activeFilter}"]`).textContent;
          filterCount.textContent = searchTerm ? 
            `${visibleCount} contributors with "${badgeLabel}" badge match search` : 
            `${visibleCount} contributors with "${badgeLabel}" badge`;
        }
      }

      // Update main count
      elCount.textContent = `${visibleCount} contributor${visibleCount === 1 ? "" : "s"}${visibleCount < people.length ? " (filtered)" : ""}`;
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        const sortType = e.target.value;
        sortedPeople = sortContributors(people, sortType);
        contributorElements = renderContributors(sortedPeople);

        // Reapply search and badge filters
        const searchInput = document.getElementById("searchInput");
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        applyFiltersAndSearch(searchTerm);
      });
    }

    // Set up stats
    const latestPerson = sortedPeople[0];
    const totalCountEl = document.getElementById("totalCount");
    const latestContributorEl = document.getElementById("latestContributor");

    if (totalCountEl) totalCountEl.textContent = people.length;
    if (latestContributorEl && latestPerson) {
      latestContributorEl.textContent =
        latestPerson.name || latestPerson.username || "Unknown";
    }

    elCount.textContent = `${people.length} contributor${people.length === 1 ? "" : "s"}`;
    elLoading.remove();
    showSpotlight(); // Initial spotlight
    elShowAnother.addEventListener("click", showSpotlight); // Add event listener for the button
  } catch (err) {
    console.error(err);
    elError.hidden = false;
    elLoading.remove();
  }
}

  function initScrollToTop() {
    const scrollButton = document.getElementById('scrollToTop');
    if (!scrollButton) return;

    // Create a sentinel element at the top
    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '200px';
    sentinel.style.height = '1px';
    document.body.insertBefore(sentinel, document.body.firstChild);

    // Observe when we scroll past the sentinel
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scrollButton.classList.remove('visible');
        } else {
          scrollButton.classList.add('visible');
        }
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);

    scrollButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;

  // Check for saved theme preference or default to 'dark'
  const currentTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  // Toggle theme on button click
  themeToggle?.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }
}

function initScrollProgress() {
  const progressBar = document.getElementById('scrollProgress');
  if (!progressBar) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${scrollPercent}%`;
  }

  window.addEventListener('scroll', updateProgress);
  updateProgress(); // initialize on load
}

// Appreciation system functions
function loadAppreciation() {
  try {
    const data = localStorage.getItem('appreciation');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Error loading appreciation data:", e);
    return {};
  }
}

function saveAppreciation(data) {
  try {
    localStorage.setItem('appreciation', JSON.stringify(data));
  } catch (e) {
    console.error("Error saving appreciation data:", e);
  }
}

function initAppreciationForContributor(username, appreciationBar) {
  const data = loadAppreciation();
  const userAppreciation = data[username] || { sent: [], counts: {} };
  const totalEl = appreciationBar.querySelector('.total-appreciation');

  // Update each button with current count and state
  const buttons = appreciationBar.querySelectorAll('.appreciation-btn');
  let totalCount = 0;

  buttons.forEach(btn => {
    const type = btn.dataset.type;
    const countEl = btn.querySelector('.count');
    const count = userAppreciation.counts[type] || 0;
    countEl.textContent = count;
    totalCount += count;

    // Mark as sent if user already sent this appreciation
    if (userAppreciation.sent && userAppreciation.sent.includes(type)) {
      btn.classList.add('sent');
    }

    // Add click event listener
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default button behavior
      e.stopPropagation(); // Prevent event from bubbling up to the parent link
      handleAppreciationClick(username, type, btn);
    });
  });

  // Update total count
  totalEl.textContent = `Total: ${totalCount} appreciation${totalCount === 1 ? '' : 's'}`;
}

function handleAppreciationClick(username, type, btn) {
  // Check if already sent
  const data = loadAppreciation();
  let userAppreciation = data[username] || { sent: [], counts: {} };

  if (!userAppreciation.sent) userAppreciation.sent = [];
  if (!userAppreciation.counts) userAppreciation.counts = {};

  if (userAppreciation.sent.includes(type)) {
    // Already sent, can't send again
    return;
  }

  // Send appreciation
  userAppreciation.sent.push(type);
  userAppreciation.counts[type] = (userAppreciation.counts[type] || 0) + 1;
  data[username] = userAppreciation;

  saveAppreciation(data);

  // Update UI
  const countEl = btn.querySelector('.count');
  countEl.textContent = userAppreciation.counts[type];
  btn.classList.add('sent', 'animating');

  // Update total count
  const appreciationBar = btn.closest('.appreciation-bar');
  const totalEl = appreciationBar.querySelector('.total-appreciation');
  const buttons = appreciationBar.querySelectorAll('.appreciation-btn');
  let totalCount = 0;

  buttons.forEach(b => {
    const t = b.dataset.type;
    totalCount += userAppreciation.counts[t] || 0;
  });

  totalEl.textContent = `Total: ${totalCount} appreciation${totalCount === 1 ? '' : 's'}`;

  // Remove animation class after animation ends
  setTimeout(() => btn.classList.remove('animating'), 400);
}

function boot() {
  fetchContributors();
  initThemeToggle();
  initScrollToTop();
  initScrollProgress();
}

boot();

const badgeIcons = {
  first: { icon: '🥇', label: 'First', color: '#ffd700' },
  core: { icon: '⭐', label: 'Core Team', color: '#667eea' },
  top: { icon: '🏆', label: 'Top Contributor', color: '#f5576c' },
  helper: { icon: '🤝', label: 'Helper', color: '#00f2fe' },
  early: { icon: '🌱', label: 'Early Adopter', color: '#43e97b' },
  milestone: { icon: '🎯', label: 'Milestone', color: '#fa709a' }
};