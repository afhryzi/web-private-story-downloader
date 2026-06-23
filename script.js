// Fungsi otomatis generate link API resmi saat user memasukkan URL biasa
function generateGraphQLUrl() {
  const input = document.getElementById("urlInput").value.trim();
  const graphqlLink = document.getElementById("graphqlLink");
  const linkPlaceholder = document.getElementById("linkPlaceholder");

  let highlightId = "";

  // Cari ID angka dari URL yang dimasukkan
  const match = input.match(/highlights\/([0-9]+)/);
  if (match && match[1]) {
    highlightId = match[1];
  } else if (/^[0-9]+$/.test(input)) {
    highlightId = input;
  }

  if (highlightId) {
    // MENGGUNAKAN API RESMI INSTAGRAM (Jauh lebih stabil dan anti-kosong)
    const targetUrl = `https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight%3A${highlightId}`;

    graphqlLink.href = targetUrl;
    graphqlLink.style.display = "inline-block";
    linkPlaceholder.style.display = "none";
  } else {
    graphqlLink.style.display = "none";
    linkPlaceholder.style.display = "block";
  }
}

// Fungsi memaksa download file lintas-domain dengan bantuan CORS Proxy
async function forceDownload(url, filename) {
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Network response was not ok.");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Proxy gagal, dialihkan ke tab baru:", error);
    window.open(url, "_blank");
  }
}

// Fungsi utama membedah JSON input dari user (Disesuaikan untuk API v1)
function extractData() {
  const rawData = document.getElementById("jsonInput").value.trim();
  const mediaContainer = document.getElementById("mediaContainer");
  const resultBox = document.getElementById("resultBox");

  mediaContainer.innerHTML = "";

  if (!rawData) {
    alert("Kotak teks Langkah 3 masih kosong! Silakan tempel datanya dulu.");
    return;
  }

  try {
    let jsonData = JSON.parse(rawData);
    let items = [];

    // Parsing jalur data untuk Instagram API v1
    if (jsonData.reels && Object.keys(jsonData.reels).length > 0) {
      const firstReelKey = Object.keys(jsonData.reels)[0];
      items = jsonData.reels[firstReelKey]?.items || [];
    } else if (jsonData.reels_media && jsonData.reels_media[0]) {
      items = jsonData.reels_media[0].items || [];
    }

    if (items.length === 0) {
      alert(
        "⚠️ Data kosong. Pastikan kamu sudah LOGIN akun Instagram di browser ini dan akunmu bisa melihat Highlight tersebut secara manual.",
      );
      return;
    }

    resultBox.style.display = "block";

    items.forEach((item, index) => {
      // Deteksi tipe media (1 = Foto, 2 = Video)
      let isVideo = item.media_type === 2;
      let downloadUrl = "";

      if (isVideo && item.video_versions) {
        // Ambil resolusi video tertinggi
        downloadUrl = item.video_versions[0].url;
      } else if (item.image_versions2 && item.image_versions2.candidates) {
        // Ambil resolusi foto tertinggi
        downloadUrl = item.image_versions2.candidates[0].url;
      }

      if (downloadUrl) {
        const card = document.createElement("div");
        card.className = "media-card";

        const info = document.createElement("div");
        info.className = "media-info";
        info.innerText = `Item #${index + 1} - [${isVideo ? "🎬 VIDEO" : "📸 FOTO"}]`;

        const btn = document.createElement("button");
        btn.className = "download-btn";
        btn.style.cursor = "pointer";
        btn.style.border = "none";

        const ext = isVideo ? "mp4" : "jpg";
        const fileName = `ig_highlight_${item.id || index + 1}.${ext}`;

        btn.innerText = "⬇️ Download";

        btn.onclick = function () {
          btn.innerText = "⏳ Downloading...";
          btn.disabled = true;

          forceDownload(downloadUrl, fileName).then(() => {
            btn.innerText = "⬇️ Download";
            btn.disabled = false;
          });
        };

        card.appendChild(info);
        card.appendChild(btn);
        mediaContainer.appendChild(card);
      }
    });
  } catch (e) {
    alert(
      "❌ Gagal membaca data. Pastikan yang kamu copy-paste adalah SEMUA teks yang muncul dari Langkah 2!",
    );
    console.error(e);
  }
}
