const audio = document.getElementById("audio");
const playlistElement = document.getElementById("playlist");
let playlist = [];

const BASE_URL = 'https://mazeincoding.github.io/playlist-app/';

async function loadPlaylist() {
  try {
    const response = await fetch(`${BASE_URL}music/`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = doc.querySelectorAll("a");

    playlist = Array.from(links)
      .filter((link) => link.href.endsWith(".mp3"))
      .map((link) => ({
        title: decodeURIComponent(
          link.href.split("/").pop().replace(".mp3", "")
        ),
        file: `${BASE_URL}music/${link.href.split("/").pop()}`,
      }));

    renderPlaylist();
  } catch (error) {
    console.error("Error loading playlist:", error);
  }
}

function renderPlaylist() {
  playlistElement.innerHTML = "";
  playlist.forEach((song, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <button class="w-full text-left py-2 px-4 hover:bg-gray-100 rounded" onclick="playSong(${index})">
                ${song.title}
            </button>
        `;
    playlistElement.appendChild(li);
  });
}

function playSong(index) {
  const song = playlist[index];
  audio.src = song.file;
  audio.play();
}

loadPlaylist();