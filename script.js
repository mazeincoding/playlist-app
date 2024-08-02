const BASE_URL = "https://mazeincoding.github.io/playlist-app/";

let playlist = [
  {
    title: "Crystal Castles - Kerosene",
    file: "music/crystal castles - kerosene.mp3",
  },
  { title: "Counting Stars", file: "music/Couting Stars.mp3" },
  {
    title: "Billie Eilish - Everything I Wanted",
    file: "music/everything i wanted - billie eilish.mp3",
  },
  {
    title: "The Neighbourhood - Sweater Weather",
    file: "music/The Neighbourhood - Sweater Weather.mp3",
  },
  { title: "Seafret - Atlantis", file: "music/Seafret - Atlantis.mp3" },
  {
    title: "David Kushner - Daylight",
    file: "music/Daylight - David Kushner.mp3",
  },
  { title: "Billie Eilish - Lovely", file: "music/Lovely-Billie Eilish.mp3" },
  { title: "Somewhere Only We Know", file: "music/Somewhere Only We Know.mp3" },
  { title: "Becky G - Shower", file: "music/Becky G - Shower.mp3" },
  { title: "Conan Gray - Heather", file: "music/Heather - Conan gray.mp3" },
  { title: "Bored (Sped Up)", file: "music/bored sped up.mp3" },
  { title: "Billie Eilish - TV", file: "music/Billie Eilish ~ Tv.mp3" },
];

function loadPlaylist() {
  const playlistElement = document.getElementById("playlist");
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
  const audio = document.getElementById("audio");
  audio.src = `${BASE_URL}${song.file}`;
  audio.play();
}

loadPlaylist();
