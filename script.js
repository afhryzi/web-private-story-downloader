// Fungsi otomatis generate link GraphQL saat user memasukkan URL biasa
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
    const targetUrl = `https://www.instagram.com/graphql/query/?query_hash=de8017ee0a7c9c45ec4260733d81ea31&variables=%7B%22reel_ids%22%3A%5B%5D%2C%22highlight_reel_ids%22%3A%5B%22${highlightId}%22%5D%2C%22precomposed_overlay%22%3Afalse%7D`;
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
  // Kita gunakan proxy khusus bernama cors-anywhere tumpangan gratis untuk bypass blokir Instagram
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);

  try {
    // Mengambil data file melalui jalur proxy agar lolos blokir CORS
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Network response was not ok.");

    const blob = await response.blob();

    // Membuat tautan unduhan virtual lokal di memori browser
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;

    // Memicu klik otomatis download ke memori internal
    document.body.appendChild(a);
    a.click();

    // Bersihkan sisa memori browser
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error(
      "Proxy gagal atau lambat, dialihkan ke tab baru (cara lama):",
      error,
    );
    // Jika proxy sedang sibuk/down, fallback buka di tab baru agar user tetap bisa save manual (klik kanan -> save as)
    window.open(url, "_blank");
  }
}

// Fungsi utama membedah JSON input dari user
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

    if (jsonData.data && jsonData.data.xdt_reels_media) {
      items = jsonData.data.xdt_reels_media[0]?.items || [];
    } else if (jsonData.data && jsonData.data.reels_media) {
      items = jsonData.data.reels_media[0]?.items || [];
    }

    if (items.length === 0) {
      alert(
        "⚠️ Data valid tetapi album Highlight kosong atau sesi akun tidak memiliki akses.",
      );
      return;
    }

    resultBox.style.display = "block";

    items.forEach((item, index) => {
      let isVideo = item.is_video;
      let downloadUrl = "";

      if (isVideo && item.video_resources) {
        downloadUrl = item.video_resources[item.video_resources.length - 1].src;
      } else if (item.display_resources) {
        downloadUrl =
          item.display_resources[item.display_resources.length - 1].src;
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

        // Eksekusi fungsi download paksa bypass CORS saat diklik
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
      "❌ Gagal membaca data. Pastikan yang kamu copy-paste adalah SEMUA teks JSON dari tab baru Langkah 2!",
    );
    console.error(e);
  }
}
