const statusMessage = document.querySelector("#status");
const repositoryList = document.querySelector("#repository-list");

function isValidRepository(repository) {
  if (!repository || typeof repository !== "object") {
    return false;
  }

  if (
    typeof repository.repository !== "string" ||
    !repository.repository.trim() ||
    typeof repository.description !== "string" ||
    typeof repository.url !== "string" ||
    typeof repository.starred_at !== "string"
  ) {
    return false;
  }

  try {
    const url = new URL(repository.url);
    if (url.protocol !== "https:" || url.hostname !== "github.com") {
      return false;
    }
  } catch {
    return false;
  }

  const date = new Date(`${repository.starred_at}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(repository.starred_at) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === repository.starred_at
  );
}

async function loadRepositories() {
  if (!statusMessage || !repositoryList) {
    console.error("Could not load starred repositories: required page elements are missing.");
    return;
  }

  try {
    const response = await fetch("events.json");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const repositories = await response.json();
    if (!Array.isArray(repositories)) {
      throw new Error("Repository data must be a list.");
    }

    const fragment = document.createDocumentFragment();
    let loadedCount = 0;

    for (const repository of repositories) {
      if (!isValidRepository(repository)) {
        console.warn("Skipping invalid starred repository entry:", repository);
        continue;
      }

      const item = document.createElement("li");
      item.className = "repository";

      const link = document.createElement("a");
      link.href = repository.url;
      link.textContent = repository.repository;

      const description = document.createElement("p");
      description.textContent = repository.description;

      const starredAt = document.createElement("time");
      starredAt.dateTime = repository.starred_at;
      starredAt.textContent = `Starred on ${repository.starred_at}`;

      item.append(link, description, starredAt);
      fragment.append(item);
      loadedCount += 1;
    }

    repositoryList.replaceChildren(fragment);

    if (loadedCount === 0 && repositories.length === 0) {
      statusMessage.textContent = "No starred repositories yet.";
    } else if (loadedCount === 0) {
      statusMessage.textContent = "No valid starred repositories could be displayed.";
    } else if (loadedCount < repositories.length) {
      statusMessage.textContent = `Loaded ${loadedCount} starred repositories. Some entries were invalid and were skipped.`;
    } else {
      statusMessage.textContent = `Loaded ${loadedCount} starred repositories.`;
    }
  } catch (error) {
    console.error("Could not load starred repositories:", error);
    statusMessage.textContent =
      "Could not load starred repositories. Please try again later.";
  }
}

loadRepositories();
