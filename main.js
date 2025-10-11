document.addEventListener("DOMContentLoaded", () => {
  // REFERENSI DOM & VARIABEL GLOBAL
  const playerHandDiv = document.getElementById("player-hand");
  const cpuHandDiv = document.getElementById("cpu-hand");
  const discardPileDiv = document.getElementById("discard-pile");
  const drawPileImg = document.getElementById("draw-pile");
  const statusText = document.getElementById("status-text");
  const unoButton = document.getElementById("uno-button");
  const playerBalanceSpan = document.getElementById("player-balance");
  const betAmountInput = document.getElementById("bet-amount");
  const startRoundButton = document.getElementById("start-round-button");
  const playerHandTitle = document.getElementById("player-hand-title");
  const cpuHandTitle = document.getElementById("cpu-hand-title");
  const activeColorText = document.getElementById("active-color-text");
  const challengeUnoButton = document.getElementById("challenge-uno-button");

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
      updateStatus("Taruhan tidak valid! (Min. $100)");
      return;
    }

    playerBalance -= bet;
    updateBalanceDisplay();
    startRoundButton.disabled = true;
    betAmountInput.disabled = true;

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
    renderAll();
    updateStatus("Ronde dimulai. Giliran Anda!");
  }

  // FUNGSI-FUNGSI TAMPILAN (RENDER)
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

  function updateStatus(message) {
    statusText.textContent = message;
  }

  function updateBalanceDisplay() {
    playerBalanceSpan.textContent = `$${playerBalance}`;
    localStorage.setItem("unoPlayerBalance", playerBalance.toString());
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
      updateStatus(
        "Anda memiliki kartu lain yang dapat dimainkan. Tidak bisa main Wild4!"
      );
      return;
    }

    if (!isMoveValid(card, playerHand)) {
      updateStatus("Kartu tidak valid!");
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
    updateStatus("Giliran Bot...");
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
            updateStatus("Bot berhasil UNO!");
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
        updateStatus("Bot mengambil kartu dan melewati giliran.");
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
        updateStatus(
          `${playedBy.toUpperCase()} main ${
            card.value
          }. Giliran ${playedBy} lagi!`
        );
        if (playedBy === "cpu") setTimeout(cpuTurn, 1000);
        return;

      case "Skip":
      case "Reverse":
        updateStatus(
          `${playedBy.toUpperCase()} main ${
            card.value
          }. Giliran ${playedBy} lagi!`
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
          updateStatus(`Bot memilih warna ${chosenColor}.`);
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
        updateStatus(`Anda memilih warna ${color}.`);
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
      cpuTurn();
    } else {
      challengeUnoButton.classList.add("hidden");
      clearTimeout(challengeTimer);
      updateStatus("Giliran Anda!");
    }
  }

  function endRound(winner) {
    const bet = parseInt(betAmountInput.value);
    let message = "";
    if (winner === "player") {
      playerBalance += bet * 2;
      message = `Anda MENANG dan mendapat $${bet * 2}!`;
    } else {
      message = `Anda KALAH taruhan $${bet}.`;
    }

    clearTimeout(challengeTimer);
    challengeUnoButton.classList.add("hidden");
    clearTimeout(unoTimer);
    unoButton.classList.add("hidden");

    alert(message);

    if (playerBalance <= 0) {
      alert("Game Over! Saldo Anda habis. Saldo direset ke $5000.");
      playerBalance = 5000;
    }
    resetForNewRound();
  }

  function resetForNewRound() {
    updateBalanceDisplay();
    startRoundButton.disabled = false;
    betAmountInput.disabled = false;
    updateStatus("Masukkan taruhan dan mulai ronde baru.");
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
        updateStatus(`${player.toUpperCase()} lupa UNO! Penalti +2 kartu.`);
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
      updateStatus("Anda melewati giliran.");
      switchTurn();
    } else {
      if (deck.length === 0) {
        updateStatus("Tumpukan kartu habis!");
        return;
      }
      playerHand.push(deck.pop());
      playerHasDrawnThisTurn = true;
      renderAll();
      updateStatus(
        "Anda mengambil kartu. Mainkan satu kartu atau klik tumpukan lagi untuk melewati giliran."
      );
    }
  });

  unoButton.addEventListener("click", () => {
    unoCalled = true;
    clearTimeout(unoTimer);
    updateStatus("UNO!");
    unoButton.classList.add("hidden");
  });

  challengeUnoButton.addEventListener("click", () => {
    if (cpuHand.length !== 1) {
      updateStatus("Tidak bisa menantang UNO saat ini.");
      challengeUnoButton.classList.add("hidden");
      return;
    }

    if (cpuUnoCalled) {
      updateStatus("Terlambat! Bot sudah berhasil menyatakan UNO.");
      challengeUnoButton.classList.add("hidden");
      return;
    }

    clearTimeout(challengeTimer);
    updateStatus(
      "Anda berhasil memanggil UNO pada Bot! Bot mengambil 2 kartu."
    );
    drawCards("cpu", 2);
    renderAll();
    challengeUnoButton.classList.add("hidden");
  });
});
