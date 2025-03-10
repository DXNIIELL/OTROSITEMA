// Initialize variables and DOM elements first
let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
const audio = new Audio();

// DOM Elements
const directorySelector = document.getElementById('directory-selector');
const playerContainer = document.getElementById('player-container');
const playlist = document.getElementById('playlist');
const directoryInput = document.getElementById('directory-input');
const selectDirectoryBtn = document.getElementById('select-directory');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.getElementById('volume-slider');
const currentSongElement = document.getElementById('current-song');
const currentArtistElement = document.getElementById('current-artist');
const currentSongImage = document.getElementById('current-song-image');

// Directory selection
selectDirectoryBtn.addEventListener('click', () => {
    directoryInput.click();
});

// Add this near the top of the file, after DOM Elements
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js';
document.head.appendChild(script);

// Modify the file handling section
// Add after your DOM Elements
const searchInput = document.getElementById('search-input');
const searchContainer = document.querySelector('.search-container');

// Modify the directoryInput event listener
directoryInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('audio/') || file.name.endsWith('.mp3')
    );

    if (files.length > 0) {
        songs = [];
        for (const file of files) {
            await new Promise((resolve) => {
                window.jsmediatags.read(file, {
                    onSuccess: function(tag) {
                        const picture = tag.tags.picture;
                        let coverUrl = './images/default-album.jpg';
                        
                        if (picture) {
                            const { data, format } = picture;
                            const base64String = data.reduce((acc, curr) => 
                                acc + String.fromCharCode(curr), '');
                            coverUrl = `data:${format};base64,${btoa(base64String)}`;
                        }

                        songs.push({
                            title: tag.tags.title || file.name.replace(/\.[^/.]+$/, ""),
                            artist: tag.tags.artist || "Unknown Artist",
                            file: file,
                            cover: coverUrl
                        });
                        resolve();
                    },
                    onError: function() {
                        songs.push({
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            artist: "Unknown Artist",
                            file: file,
                            cover: './images/default-album.jpg'
                        });
                        resolve();
                    }
                });
            });
        }

        directorySelector.classList.add('hidden');
        playerContainer.classList.remove('hidden');
        searchContainer.classList.remove('hidden');
        playlist.classList.remove('hidden');
        
        // Esperar a que todas las canciones se carguen antes de inicializar
        await Promise.all(songs.map(song => Promise.resolve()));
        initializePlaylist();
        if (songs.length > 0) {
            loadAndPlaySong(0);
        }
    }
});

// Modificar la función initializePlaylist
function initializePlaylist() {
    playlist.innerHTML = '';
    songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>
        `;
        songElement.addEventListener('click', () => {
            playSong(index);
        });
        playlist.appendChild(songElement);
    });

    // Actualizar el buscador
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const songItems = playlist.querySelectorAll('.song-item');
        
        songItems.forEach((item, index) => {
            const title = songs[index].title.toLowerCase();
            const artist = songs[index].artist.toLowerCase();
            
            if (title.includes(searchTerm) || artist.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

function playSong(index) {
    currentSongIndex = index;
    loadAndPlaySong();
}

function loadAndPlaySong() {
    const song = songs[currentSongIndex];
    const fileUrl = URL.createObjectURL(song.file);
    audio.src = fileUrl;
    currentSongElement.textContent = song.title;
    currentArtistElement.textContent = song.artist;
    currentSongImage.src = song.cover;
    
    audio.play().then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }).catch(error => {
        console.error("Error playing audio:", error);
    });
}

// Player controls
playBtn.onclick = () => {
    if (isPlaying) {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
};

prevBtn.onclick = () => {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadAndPlaySong();
};

nextBtn.onclick = () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadAndPlaySong();
};

volumeSlider.oninput = (e) => {
    audio.volume = e.target.value / 100;
};

audio.addEventListener('ended', () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadAndPlaySong();
});

// Add search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const songItems = playlist.querySelectorAll('.song-item');
    
    songItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const artist = item.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || artist.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});