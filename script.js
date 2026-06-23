// Fungsi utama membedah JSON input dari user dan menampilkan preview foto/video yang FIX
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
      let previewUrl = "";

      if (isVideo && item.video_resources) {
        downloadUrl = item.video_resources[item.video_resources.length - 1].src;
        previewUrl = item.display_resources
          ? item.display_resources[item.display_resources.length - 1].src
          : "";
      } else if (item.display_resources) {
        downloadUrl =
          item.display_resources[item.display_resources.length - 1].src;
        previewUrl = downloadUrl;
      }

      if (downloadUrl) {
        const card = document.createElement("div");
        card.className = "media-card";

        const info = document.createElement("div");
        info.className = "media-info";
        info.innerText = `Item #${index + 1} - [${isVideo ? "🎬 VIDEO" : "📸 FOTO"}]`;

        // --- PROSES BYPASS GAMBAR PECAH VIA PROXY KHUSUS GAMBAR ---
        const imgPreview = document.createElement("img");
        if (previewUrl) {
          imgPreview.className = "media-preview";

          // Bersihkan awalan URL agar kompatibel penuh dengan proxy weserv
          let cleanUrl = previewUrl.replace(/^https?:\/\//i, "");
          imgPreview.src = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&default=https://placehold.co/200x300/252525/ffffff?text=Preview+Ready`;
          imgPreview.alt = `Preview ${index + 1}`;

          // Cadangan jika sewaktu-waktu proxy gambar utama membatasi request
          imgPreview.onerror = function () {
            imgPreview.src =
              "https://corsproxy.io/?" + encodeURIComponent(previewUrl);
          };
        }

        const btn = document.createElement("button");
        btn.className = "download-btn";

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

        // Susun struktur elemen kartu kembali rapi vertikal ke bawah
        card.appendChild(info);
        if (previewUrl) card.appendChild(imgPreview);
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
