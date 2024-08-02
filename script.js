let playlist = [
    { title: "Crystal Castles - Kerosene", file: "https://drive.google.com/uc?export=download&id=198C38hKY2KRD3zMm51tKjLUeOYX-lXMi" },
    { title: "Counting Stars", file: "https://drive.google.com/uc?export=download&id=1CTzgGUa-LEFstiQA7-Hc-ST9j6jAiSeA" },
    { title: "Billie Eilish - Everything I Wanted", file: "https://drive.google.com/uc?export=download&id=1FmjqHqoLdJ-_xWj9XKXvJweqc_wgEfKH" },
    { title: "The Neighbourhood - Sweater Weather", file: "https://drive.google.com/uc?export=download&id=1JDz2r9GISGkZ_dgPBmklzFew-SSrXkqf" },
    { title: "Seafret - Atlantis", file: "https://drive.google.com/uc?export=download&id=1KhQ0hbPmwNfgmCwM-GpHq-fPKF1-1mAb" },
    { title: "David Kushner - Daylight", file: "https://drive.google.com/uc?export=download&id=1Mtv48xTdiglUsLJd1lVneirg5xzYyVM5" },
    { title: "Billie Eilish - Lovely", file: "https://drive.google.com/uc?export=download&id=1TRKUWe6twz4DFJ0zVwkIrejOzYUeZqJg" },
    { title: "Somewhere Only We Know", file: "https://drive.google.com/uc?export=download&id=1VfTqtt4QTbgN4ceY4L0uZ7Hs9EkjVyXS" },
    { title: "Becky G - Shower", file: "https://drive.google.com/uc?export=download&id=1VgHNdmgX_UqntnWh2TGGU0hpL-ccM-ma" },
    { title: "Conan Gray - Heather", file: "https://drive.google.com/uc?export=download&id=1YptKaDccBLXEJm8fZgiFGT-iegjG1w14" },
    { title: "Bored (Sped Up)", file: "https://drive.google.com/uc?export=download&id=1feOHw5CyB_gKHoKIpuVhzFYamFNh2NNa" },
    { title: "Billie Eilish - TV", file: "https://drive.google.com/uc?export=download&id=1mjERl9MeT7oMiypAkQMNheCL3QpQx5wJ" }
];

function loadPlaylist() {
    const playlistElement = document.getElementById('playlist');
    playlistElement.innerHTML = '';
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
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
    const audio = document.getElementById('audio');
    audio.src = song.file;
    audio.play();
}

loadPlaylist();