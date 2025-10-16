document.addEventListener("DOMContentLoaded", () => {
  // REFERENSI DOM & VARIABEL GLOBAL
  const playerHandDiv = document.getElementById("player-hand");
  const cpuHandDiv = document.getElementById("cpu-hand");
  const discardPileDiv = document.getElementById("discard-pile");
  const drawPileImg = document.getElementById("draw-pile");
  const unoButton = document.getElementById("uno-button");
  const playerBalanceSpan = document.getElementById("player-balance");
  const betAmountInput = document.getElementById("bet-amount");
  const startRoundButton = document.getElementById("start-round-button");
  const playerHandTitle = document.getElementById("player-hand-title");
  const cpuHandTitle = document.getElementById("cpu-hand-title");
  const activeColorText = document.getElementById("active-color-text");
  const challengeUnoButton = document.getElementById("challenge-uno-button");
  const notificationPopup = document.getElementById("notification-popup");
  const notificationText = document.getElementById("notification-text");
  const unoLogoPopup = document.getElementById("uno-logo-popup");

  let deck = [];
  let playerHand = [];
  let cpuHand = [];
  let discardPile = [];
  let currentPlayer = "player";
  let playerBalance = 5000;
  let unoTimer = null;
  let unoCalled = false;
  let playerHasDrawnThisTurn = false;
  let challengeTimer = null;
  let cpuUnoCalled = false;
  let notificationTimeout = null;
  const colorMap = {
    Merah: "text-red-400",
    Hijau: "text-green-400",
    Biru: "text-blue-400",
    Kuning: "text-yellow-300",
  };

  // FUNGSI-FUNGSI UTAMA PERSIAPAN
  function createDeck() {
    deck = [];
    const colors = [
      { js: "Merah", file: "red" },
      { js: "Hijau", file: "green" },
      { js: "Biru", file: "blue" },
      { js: "Kuning", file: "yellow" },
    ];
    const values = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "Skip",
      "Reverse",
      "Draw2",
    ];
    for (let color of colors) {
      for (let value of values) {
        let fileValue = value;
        if (value === "Skip") fileValue = "10";
        if (value === "Reverse") fileValue = "11";
        if (value === "Draw2") fileValue = "12";
        const card = {
          color: color.js,
          value,
          image: `asset/${color.file}${fileValue}.png`,
        };
        deck.push(card);
        if (value !== "0") deck.push(card);
      }
    }
    deck.push({ color: "Liar", value: "Wild", image: "asset/wild13.png" });
    deck.push({ color: "Liar", value: "Wild", image: "asset/wild13.png" });
    deck.push({ color: "Liar", value: "Wild", image: "asset/wild13.png" });
    deck.push({ color: "Liar", value: "Wild", image: "asset/wild13.png" });
    deck.push({ color: "Liar", value: "Wild4", image: "asset/wild14.png" });
    deck.push({ color: "Liar", value: "Wild4", image: "asset/wild14.png" });
    deck.push({ color: "Liar", value: "Wild4", image: "asset/wild14.png" });
    deck.push({ color: "Liar", value: "Wild4", image: "asset/wild14.png" });
  }

  function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  function startNewRound() {
    const bet = parseInt(betAmountInput.value);
    if (isNaN(bet) || bet < 100 || bet > playerBalance) {
      showNotification("Taruhan tidak valid! (Min. $100)", "warning");
      return;
    }

    startRoundButton.disabled = true;
    betAmountInput.disabled = true;

    // Tampilkan popup logo
    const logoImg = unoLogoPopup.querySelector("img");
    logoImg.classList.remove("animate-popup"); // Reset animasi
    void logoImg.offsetWidth; // Trigger reflow
    logoImg.classList.add("animate-popup");
    unoLogoPopup.classList.remove("hidden");

    // Sembunyikan popup dan mulai game setelah delay
    setTimeout(() => {
      unoLogoPopup.classList.add("hidden");

      // Logika ronde dimulai di sini
      playerBalance -= bet;
      updateBalanceDisplay();

      clearTimeout(unoTimer);
      unoButton.classList.add("hidden");
      clearTimeout(challengeTimer);
      challengeUnoButton.classList.add("hidden");
      unoCalled = false;
      cpuUnoCalled = false;

      createDeck();
      shuffleDeck();
      playerHand = deck.splice(0, 7);
      cpuHand = deck.splice(0, 7);
      let startCard = deck.pop();
      while (startCard.value === "Wild4") {
        deck.push(startCard);
        shuffleDeck();
        startCard = deck.pop();
      }
      discardPile = [startCard];
      if (startCard.color === "Liar") {
        startCard.color = ["Merah", "Hijau", "Biru", "Kuning"][
          Math.floor(Math.random() * 4)
        ];
      }
      currentPlayer = "player";
      animateDealing(); // Memulai ronde dengan animasi pembagian kartu
    }, 1500); // Durasi popup (1.5 detik)
  }

  // FUNGSI-FUNGSI TAMPILAN (RENDER)
  function animateDealing() {
    playerHandDiv.innerHTML = "";
    cpuHandDiv.innerHTML = "";
    renderDiscardPile();
    updateHandTitles();
    showNotification("Membagikan kartu...", "info", 1500);

    let dealIndex = 0;
    const dealInterval = setInterval(() => {
      if (dealIndex < 7) {
        // Bagikan ke pemain
        const playerCardImg = document.createElement("img");
        playerCardImg.src = playerHand[dealIndex].image;
        playerCardImg.className =
          "w-24 h-36 player-card cursor-pointer card-deal-animation";
        playerHandDiv.appendChild(playerCardImg);

        // Bagikan ke CPU
        const cpuCardImg = document.createElement("img");
        cpuCardImg.src = "asset/back.png";
        cpuCardImg.className = "w-24 h-36 card-deal-animation";
        cpuHandDiv.appendChild(cpuCardImg);

        setTimeout(() => {
          playerCardImg.style.opacity = 1;
          playerCardImg.style.transform = "translateY(0)";
          cpuCardImg.style.opacity = 1;
          cpuCardImg.style.transform = "translateY(0)";
        }, 50);

        dealIndex++;
      } else {
        clearInterval(dealInterval);
        // Setelah animasi selesai, render ulang dengan event listener dan highlight
        setTimeout(() => {
          showNotification("Giliran Anda!", "player");
          // Pesan status bawah sudah dihapus, jadi tidak perlu update lagi
          renderAll();
        }, 500);
      }
    }, 150); // Interval waktu antar kartu
  }

  function renderAll() {
    renderHand(playerHand, playerHandDiv, "player");
    renderHand(cpuHand, cpuHandDiv, "cpu");
    renderDiscardPile();
    updateHandTitles();
  }

  function renderHand(hand, element, owner) {
    element.innerHTML = "";
    hand.forEach((card) => {
      const cardImg = document.createElement("img");
      cardImg.src = owner === "player" ? card.image : "asset/back.png";
      cardImg.className = "w-24 h-36";

      if (owner === "player") {
        cardImg.classList.add("player-card", "cursor-pointer");
        // Tambahkan efek highlight jika kartu bisa dimainkan
        if (currentPlayer === "player" && isMoveValid(card, hand)) {
          cardImg.classList.add("playable-card");
        } else {
          cardImg.classList.remove("playable-card");
        }
        cardImg.addEventListener("click", () => playerPlayCard(card));
      }

      if (owner === "cpu" && hand.length === 1) {
        element.style.position = "relative";

        const unoText = document.createElement("div");
        unoText.textContent = "UNO!";
        unoText.className =
          "absolute text-4xl font-black text-white p-2 rounded-lg bg-red-600 shadow-xl border-4 border-yellow-400 transform -rotate-12";
        unoText.style.top = "10px";
        unoText.style.left = "calc(50% + 50px)";
        unoText.style.zIndex = "5";
        element.appendChild(cardImg);
        element.appendChild(unoText);
      } else {
        element.appendChild(cardImg);
      }
    });

    if (owner === "cpu" && hand.length !== 1) {
      element.style.position = "";
    }
  }

  function renderDiscardPile() {
    const topCard = discardPile[discardPile.length - 1];
    discardPileDiv.innerHTML = `<img src="${topCard.image}" alt="${topCard.color} ${topCard.value}" class="w-full h-full rounded-lg shadow-lg">`;
    activeColorText.textContent = `Warna: ${topCard.color}`;
    activeColorText.className = "text-center mt-2 font-bold";
    if (colorMap[topCard.color]) {
      activeColorText.classList.add(colorMap[topCard.color]);
    }
    if (topCard.color === "Liar") {
      activeColorText.textContent = "Pilih warna!";
    }
  }

  function updateHandTitles() {
    playerHandTitle.textContent = `Kartu Anda (${playerHand.length} kartu)`;
    cpuHandTitle.textContent = `Bot (${cpuHand.length} kartu)`;
  }

  function updateBalanceDisplay() {
    playerBalanceSpan.textContent = `$${playerBalance}`;
    localStorage.setItem("unoPlayerBalance", playerBalance.toString());
  }

  function showNotification(message, type, duration = 2500) {
    clearTimeout(notificationTimeout); // Hapus notifikasi sebelumnya jika ada

    notificationText.textContent = message;
    // Reset kelas
    notificationPopup.className =
      "hidden fixed top-1/2 left-6 -translate-y-1/2 bg-gray-900 border-4 p-6 rounded-2xl shadow-2xl z-50 pointer-events-none";
    notificationText.className = "text-3xl font-bold text-center";

    // Terapkan style berdasarkan tipe
    if (type === "player") {
      notificationPopup.classList.add("border-green-400");
      notificationText.classList.add("text-green-300");
    } else if (type === "cpu") {
      notificationPopup.classList.add("border-red-400");
      notificationText.classList.add("text-red-300");
    } else if (type === "warning") {
      notificationPopup.classList.add("border-yellow-400");
      notificationText.classList.add("text-yellow-300");
    } else {
      notificationPopup.classList.add("border-gray-500");
      notificationText.classList.add("text-white");
    }

    notificationPopup.classList.remove("hidden");
    notificationTimeout = setTimeout(() => {
      notificationPopup.classList.add("hidden");
    }, duration);
  }

  // FUNGSI LOGIKA PERMAINAN

  function isMoveValid(card, hand) {
    const topCard = discardPile[discardPile.length - 1];
    if (card.color === "Liar") {
      if (card.value === "Wild4") {
        const hasPlayableCard = hand.some(
          (c) =>
            c.color !== "Liar" &&
            (c.color === topCard.color || c.value === topCard.value)
        );
        return !hasPlayableCard;
      }
      return true;
    }
    return card.color === topCard.color || card.value === topCard.value;
  }

  function playerPlayCard(card) {
    if (currentPlayer !== "player") return;

    const topCard = discardPile[discardPile.length - 1];

    if (card.value === "Wild4" && !isMoveValid(card, playerHand)) {
      showNotification(
        "Anda punya kartu lain! Tidak bisa main Wild+4.",
        "warning"
      );
      return;
    }

    if (!isMoveValid(card, playerHand)) {
      showNotification("Kartu tidak valid!", "warning");
      return;
    }

    playerHand = playerHand.filter((c) => c !== card);
    discardPile.push(card);
    playerHasDrawnThisTurn = false;

    clearTimeout(unoTimer);
    unoButton.classList.add("hidden");

    renderAll();

    if (playerHand.length === 0) {
      endRound("player");
      return;
    }

    if (playerHand.length === 1) {
      startUnoTimer("player");
    }

    handleCardEffect(card, "player");
  }

  function cpuTurn() {
    showNotification("Giliran Bot", "cpu");

    setTimeout(() => {
      let cardToPlay = cpuHand.find((card) => isMoveValid(card, cpuHand));
      if (cardToPlay) {
        cpuHand = cpuHand.filter((c) => c !== cardToPlay);
        discardPile.push(cardToPlay);

        clearTimeout(challengeTimer);
        challengeUnoButton.classList.add("hidden");
        cpuUnoCalled = false;

        if (cpuHand.length === 1) {
          challengeUnoButton.classList.remove("hidden");
          challengeTimer = setTimeout(() => {
            cpuUnoCalled = true;
            showNotification("Bot berhasil UNO!", "cpu");
            challengeUnoButton.classList.add("hidden");
          }, 3000);
        }

        if (cpuHand.length === 0) {
          renderAll();
          endRound("cpu");
          return;
        }
        handleCardEffect(cardToPlay, "cpu");
      } else {
        if (deck.length > 0) cpuHand.push(deck.pop());
        showNotification("Bot mengambil kartu.", "info");
        switchTurn();
      }
      renderAll();
    }, 1500);
  }

  function handleCardEffect(card, playedBy) {
    const opponent = playedBy === "player" ? "cpu" : "player";

    switch (card.value) {
      case "Draw2":
        drawCards(opponent, 2);
        showNotification(
          `${playedBy === "player" ? "Anda" : "Bot"} main +2. Giliran lagi!`,
          playedBy === "player" ? "player" : "cpu"
        );
        if (playedBy === "cpu") setTimeout(cpuTurn, 1000);
        return;

      case "Skip":
      case "Reverse":
        showNotification(
          `${playedBy === "player" ? "Anda" : "Bot"} main ${
            card.value
          }. Giliran lagi!`,
          playedBy === "player" ? "player" : "cpu"
        );
        if (playedBy === "cpu") setTimeout(cpuTurn, 1000);
        return;

      case "Wild":
      case "Wild4":
        if (card.value === "Wild4") drawCards(opponent, 4);
        if (playedBy === "player") {
          setTimeout(chooseColorPrompt, 100);
        } else {
          const colorsInHand = cpuHand
            .map((c) => c.color)
            .filter((c) => c !== "Liar");
          const colorCounts = colorsInHand.reduce((acc, color) => {
            acc[color] = (acc[color] || 0) + 1;
            return acc;
          }, {});
          const chosenColor =
            Object.keys(colorCounts).sort(
              (a, b) => colorCounts[b] - colorCounts[a]
            )[0] ||
            ["Merah", "Hijau", "Biru", "Kuning"][Math.floor(Math.random() * 4)];

          discardPile[discardPile.length - 1].color = chosenColor;
          showNotification(`Bot memilih warna ${chosenColor}.`, "info");
          renderDiscardPile();
          switchTurn();
        }
        return;
    }
    // Giliran normal
    switchTurn();
  }

  function chooseColorPrompt() {
    const colorChoices = ["Merah", "Hijau", "Biru", "Kuning"];
    let choiceMade = false;

    const colorPickerDiv = document.createElement("div");
    colorPickerDiv.style.position = "fixed";
    colorPickerDiv.style.top = "50%";
    colorPickerDiv.style.left = "50%";
    colorPickerDiv.style.transform = "translate(-50%, -50%)";
    colorPickerDiv.style.backgroundColor = "rgba(0,0,0,0.9)";
    colorPickerDiv.style.padding = "20px";
    colorPickerDiv.style.borderRadius = "10px";
    colorPickerDiv.style.zIndex = "100";
    colorPickerDiv.style.color = "white";
    colorPickerDiv.innerHTML = `<h3 class="text-center mb-4 text-xl font-bold">Pilih Warna:</h3>`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex gap-4";
    colorPickerDiv.appendChild(buttonContainer);

    colorChoices.forEach((color) => {
      const button = document.createElement("button");
      button.textContent = color;
      button.className = `font-bold py-2 px-4 rounded transition-colors`;
      if (color === "Merah") button.className += " bg-red-600 hover:bg-red-700";
      if (color === "Hijau")
        button.className += " bg-green-600 hover:bg-green-700";
      if (color === "Biru")
        button.className += " bg-blue-600 hover:bg-blue-700";
      if (color === "Kuning")
        button.className += " bg-yellow-400 hover:bg-yellow-500 text-black";

      button.onclick = () => {
        if (choiceMade) return;
        choiceMade = true;
        discardPile[discardPile.length - 1].color = color;
        showNotification(`Anda memilih warna ${color}.`, "info");
        renderDiscardPile();
        switchTurn();
        document.body.removeChild(colorPickerDiv);
      };
      buttonContainer.appendChild(button);
    });

    document.body.appendChild(colorPickerDiv);
  }

  function drawCards(player, amount) {
    for (let i = 0; i < amount; i++) {
      if (deck.length > 0) {
        if (player === "player") playerHand.push(deck.pop());
        else cpuHand.push(deck.pop());
      }
    }
  }

  function switchTurn() {
    currentPlayer = currentPlayer === "player" ? "cpu" : "player";
    playerHasDrawnThisTurn = false;
    if (currentPlayer === "cpu") {
      cpuTurn(); // showTurnIndicator dipanggil di dalam cpuTurn
    } else {
      challengeUnoButton.classList.add("hidden");
      clearTimeout(challengeTimer);
      showNotification("Giliran Anda!", "player");
      renderAll(); // Render ulang untuk update highlight kartu
    }
  }

  function endRound(winner) {
    const bet = parseInt(betAmountInput.value);
    let message = "";
    if (winner === "player") {
      playerBalance += bet * 2;
      message = `Anda MENANG! Hadiah: $${bet * 2}`;
    } else {
      message = `Anda KALAH! Taruhan $${bet} hangus.`;
    }

    clearTimeout(challengeTimer);
    challengeUnoButton.classList.add("hidden");
    clearTimeout(unoTimer);
    unoButton.classList.add("hidden");

    const notificationDuration = 5000;
    showNotification(
      message,
      winner === "player" ? "player" : "cpu",
      notificationDuration
    );

    // Beri jeda sebelum mereset ronde agar notifikasi kemenangan/kekalahan terlihat
    setTimeout(() => {
      if (playerBalance <= 0) {
        showNotification("Game Over! Saldo direset ke $5000.", "warning", 5000);
        playerBalance = 5000;
      }
      resetForNewRound();
    }, notificationDuration);
  }

  function resetForNewRound() {
    updateBalanceDisplay();
    startRoundButton.disabled = false;
    betAmountInput.disabled = false;
    showNotification("Mulai ronde baru kapan saja.", "info", 4000);
    playerHandDiv.innerHTML = "";
    cpuHandDiv.innerHTML = "";
    discardPileDiv.innerHTML = "";
    activeColorText.textContent = "";
    activeColorText.className = "text-center mt-2 font-bold";
  }

  function startUnoTimer(player) {
    unoButton.classList.remove("hidden");
    unoCalled = false;
    unoTimer = setTimeout(() => {
      if (!unoCalled) {
        showNotification("Lupa UNO! Penalti +2 kartu.", "warning");
        drawCards(player, 2);
        renderAll();
      }
      unoButton.classList.add("hidden");
    }, 5000);
  }

  // EVENT LISTENERS & INISIALISASI

  startRoundButton.addEventListener("click", startNewRound);

  drawPileImg.addEventListener("click", () => {
    if (currentPlayer !== "player") return;

    if (playerHasDrawnThisTurn) {
      showNotification("Anda melewati giliran.", "info");
      switchTurn();
    } else {
      if (deck.length === 0) {
        showNotification("Tumpukan kartu habis!", "warning");
        return;
      }
      playerHand.push(deck.pop());
      playerHasDrawnThisTurn = true;
      renderAll();
      showNotification(
        "Anda ambil kartu. Mainkan atau klik lagi untuk lewat.",
        "info"
      );
    }
  });

  unoButton.addEventListener("click", () => {
    unoCalled = true;
    clearTimeout(unoTimer);
    showNotification("UNO!", "player");
    unoButton.classList.add("hidden");
  });

  challengeUnoButton.addEventListener("click", () => {
    if (cpuHand.length !== 1) {
      showNotification("Tantangan tidak valid.", "warning");
      challengeUnoButton.classList.add("hidden");
      return;
    }

    if (cpuUnoCalled) {
      showNotification("Terlambat! Bot sudah UNO.", "warning");
      challengeUnoButton.classList.add("hidden");
      return;
    }

    clearTimeout(challengeTimer);
    showNotification("Berhasil! Bot kena penalti +2 kartu.", "player");
    drawCards("cpu", 2);
    renderAll();
    challengeUnoButton.classList.add("hidden");
  });
});
