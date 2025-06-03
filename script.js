document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("table");
  const buttonTracer = document.getElementById("tracer");
  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");
  const gridSizeInput = document.getElementById("sizeSlider");
  const TDs = document.querySelectorAll("td");

  let click = 0;
  let cases = [];
  let cellColors = {};
  let isAnimating = false;
  let fileName = "creation";
  let gridSize = 10;
  let isMouseDown = false;
  let isDragging = false;

  function getCellSize() {
    const maxSize = Math.min(600, window.innerWidth - 100);
    return Math.max(15, Math.floor(maxSize / gridSize));
  }

  function loadData() {
    const savedCases = JSON.parse(localStorage.getItem("drawingCases") || "[]");
    const savedColors = JSON.parse(
      localStorage.getItem("drawingColors") || "{}"
    );
    const savedClick = parseInt(localStorage.getItem("drawingClick") || "0");
    const savedGridSize = parseInt(
      localStorage.getItem("drawingGridSize") || "10"
    );

    cases = savedCases;
    cellColors = savedColors;
    click = savedClick;
    gridSize = savedGridSize;
    gridSizeInput.value = gridSize;
  }

  function saveData() {
    localStorage.setItem("drawingCases", JSON.stringify(cases));
    localStorage.setItem("drawingColors", JSON.stringify(cellColors));
    localStorage.setItem("drawingClick", click.toString());
    localStorage.setItem("drawingGridSize", gridSize.toString());
  }

  function generateTable() {
    table.innerHTML = "";
    const cellSize = getCellSize();
    const totalCells = gridSize * gridSize;

    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      if (!table.rows[row]) {
        table.insertRow(row);
      }

      const cell = table.rows[row].insertCell(col);
      cell.id = `cell-${i + 1}`;
      cell.style.width = cellSize + "px";
      cell.style.height = cellSize + "px";
      cell.style.fontSize = Math.max(8, Math.floor(cellSize * 0.3)) + "px";

      const cellId = i + 1;
      const caseIndex = cases.indexOf(cellId);
      if (caseIndex !== -1) {
        cell.style.color = cellColors[cellId] || "#000000";
        cell.innerText = caseIndex + 1;
      }

      cell.addEventListener("mousedown", handleMouseDown);
      cell.addEventListener("mouseenter", handleMouseEnter);
      cell.addEventListener("mouseup", handleMouseUp);
    }

    document.addEventListener("mouseup", () => {
      isMouseDown = false;
      isDragging = false;
    });

    table.addEventListener("selectstart", (e) => e.preventDefault());
  }

  function handleMouseDown(event) {
    event.preventDefault();
    isMouseDown = true;
    isDragging = false;
    handleCellClick(event);
  }

  function handleMouseEnter(event) {
    if (isMouseDown) {
      isDragging = true;
      handleCellClick(event);
    }
  }

  function handleMouseUp(event) {
    isMouseDown = false;
    if (!isDragging) {
      // Si on n'a pas fait de drag, on traite comme un clic normal
      handleCellClick(event);
    }
    isDragging = false;
  }

  function handleCellClick(event) {
    if (isAnimating) return;

    const cell = event.target;
    const cellId = parseInt(cell.id.replace("cell-", ""));
    const color = document.getElementById("color").value;
    const gomme = document.getElementById("gomme").checked;
    const fillModeActive = document.getElementById("fillMode").checked;

    if (gomme) {
      eraseCell(cell, cellId);
    } else if (fillModeActive && !isDragging) {
      // Le remplissage ne fonctionne qu'au clic, pas en drag
      fillArea(cellId, color);
    } else if (!fillModeActive) {
      colorCell(cell, cellId, color);
    }

    saveData();
  }

  function colorCell(cell, cellId, color) {
    const isAlreadyPainted = cases.includes(cellId);

    if (isAlreadyPainted) {
      cell.style.color = color;
      cellColors[cellId] = color;
    } else {
      cell.style.color = color;
      cell.innerText = click + 1;
      cases.push(cellId);
      cellColors[cellId] = color;
      click++;
    }
  }

  function eraseCell(cell, cellId) {
    if (cell.innerHTML === "") return;

    const caseIndex = cases.indexOf(cellId);
    if (caseIndex !== -1) {
      cases.splice(caseIndex, 1);
      delete cellColors[cellId];
      cell.innerHTML = "";
      cell.style.color = "";
      cell.style.backgroundColor = "";
      click--;

      renumberCells();
    }
  }

  function renumberCells() {
    cases.forEach((cellId, index) => {
      const cell = document.getElementById(`cell-${cellId}`);
      if (cell) {
        cell.innerText = index + 1;
      }
    });
  }

  function fillArea(startCellId, newColor) {
    const startCell = document.getElementById(`cell-${startCellId}`);
    if (!startCell) return;

    const originalColor = cellColors[startCellId] || null;
    const isOriginalEmpty = !cases.includes(startCellId);

    if (!isOriginalEmpty && originalColor === newColor) return;

    const visited = new Set();
    const queue = [startCellId];
    const cellsToFill = [];
    const totalCells = gridSize * gridSize;

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (currentId < 1 || currentId > totalCells) continue;

      const currentCell = document.getElementById(`cell-${currentId}`);
      if (!currentCell) continue;

      const currentCellColor = cellColors[currentId] || null;
      const isCurrentEmpty = !cases.includes(currentId);
      const shouldFill =
        (isOriginalEmpty && isCurrentEmpty) ||
        (!isOriginalEmpty &&
          !isCurrentEmpty &&
          currentCellColor === originalColor);

      if (shouldFill) {
        cellsToFill.push(currentId);

        const row = Math.floor((currentId - 1) / gridSize);
        const col = (currentId - 1) % gridSize;

        const neighbors = [];

        if (row > 0) neighbors.push((row - 1) * gridSize + col + 1);
        if (row < gridSize - 1) neighbors.push((row + 1) * gridSize + col + 1);
        if (col > 0) neighbors.push(row * gridSize + col);
        if (col < gridSize - 1) neighbors.push(row * gridSize + col + 2);

        neighbors.forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        });
      }
    }

    cellsToFill.forEach((id) => {
      const cell = document.getElementById(`cell-${id}`);
      const wasAlreadyPainted = cases.includes(id);

      if (wasAlreadyPainted) {
        cell.style.color = newColor;
        cellColors[id] = newColor;
      } else {
        colorCell(cell, id, newColor);
      }
    });
  }

  async function tracer(cellId) {
    const speed = parseInt(speedSlider.value);
    return new Promise((resolve) => {
      setTimeout(() => {
        const cell = document.getElementById(`cell-${cellId}`);
        if (cell) {
          cell.innerText = "";
          cell.style.backgroundColor = cell.style.color;
          cell.classList.add("traced");
          setTimeout(() => {
            cell.classList.remove("traced");
          }, 600);
        }
        resolve();
      }, speed);
    });
  }

  async function tracerDebut(casesToTrace) {
    isAnimating = true;
    for (let i = 0; i < casesToTrace.length; i++) {
      await tracer(casesToTrace[i]);
    }
    isAnimating = false;
  }

  function updateGrid() {
    const newSize = parseInt(gridSizeInput.value);
    if (newSize >= 5 && newSize <= 50) {
      gridSize = newSize;
      resetGrid();
    }
    TDs.forEach((td) => {
      td.style.width = 1 / gridSize + "px";
      td.style.height = 1 / gridSize + "px";
      td.style.fontSize = Math.max(8, Math.floor((1 / gridSize) * 0.3)) + "px";
    });
  }

  function resetGrid() {
    click = 0;
    cases = [];
    cellColors = {};
    generateTable();
    saveData();
  }

  function generateRandom() {
    resetGrid();
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#ffeaa7",
      "#dda0dd",
    ];
    const totalCells = gridSize * gridSize;
    const numCells =
      Math.floor(Math.random() * Math.floor(totalCells * 0.3)) +
      Math.floor(totalCells * 0.2);

    for (let i = 0; i < numCells; i++) {
      const cellId = Math.floor(Math.random() * totalCells) + 1;
      const cell = document.getElementById(`cell-${cellId}`);
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (cell && cell.innerText === "") {
        colorCell(cell, cellId, color);
      }
    }
    saveData();
  }
  const adaptivePatterns = {
    star: function (gridSize) {
      const pattern = [];
      const starCells = [];
      const center = gridSize / 2;
      const outerRadius = gridSize * 0.4;
      const innerRadius = gridSize * 0.2;

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x = col - center;
          const y = row - center;
          const angle = Math.atan2(y, x);
          const distance = Math.sqrt(x * x + y * y);

          const angleStep = (2 * Math.PI) / 10;
          const normalizedAngle = (angle + Math.PI) % (2 * Math.PI);
          const sectionAngle = normalizedAngle % angleStep;
          const isOuterSection =
            Math.floor(normalizedAngle / angleStep) % 2 === 0;

          const maxRadius = isOuterSection ? outerRadius : innerRadius;
          const radiusAtAngle =
            innerRadius +
            (maxRadius - innerRadius) *
              (1 - Math.abs(sectionAngle - angleStep / 2) / (angleStep / 2));

          if (distance <= radiusAtAngle) {
            starCells.push(row * gridSize + col + 1);
          }
        }
      }

      pattern.push({ cells: starCells, color: "#f6e05e" });
      return pattern;
    },

    tree: function (gridSize) {
      const pattern = [];
      const trunkCells = [];
      const leavesCells = [];

      const trunkWidth = Math.max(1, Math.floor(gridSize * 0.1));
      const trunkHeight = Math.floor(gridSize * 0.3);
      const trunkStartCol = Math.floor((gridSize - trunkWidth) / 2);
      const trunkStartRow = gridSize - trunkHeight;

      for (let row = trunkStartRow; row < gridSize; row++) {
        for (let col = trunkStartCol; col < trunkStartCol + trunkWidth; col++) {
          trunkCells.push(row * gridSize + col + 1);
        }
      }

      const leavesRadius = Math.floor(gridSize * 0.3);
      const leavesCenter = Math.floor(gridSize / 2);
      const leavesTopY = Math.floor(gridSize * 0.2);

      const leafCenters = [
        [leavesTopY, leavesCenter],
        [
          leavesTopY + Math.floor(leavesRadius * 0.7),
          leavesCenter - Math.floor(leavesRadius * 0.5),
        ],
        [
          leavesTopY + Math.floor(leavesRadius * 0.7),
          leavesCenter + Math.floor(leavesRadius * 0.5),
        ],
      ];

      leafCenters.forEach(([centerY, centerX]) => {
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const distance = Math.sqrt(
              Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2)
            );
            if (distance <= leavesRadius) {
              const cellId = row * gridSize + col + 1;
              if (!leavesCells.includes(cellId)) {
                leavesCells.push(cellId);
              }
            }
          }
        }
      });

      pattern.push({ cells: leavesCells, color: "#4fd176" });
      pattern.push({ cells: trunkCells, color: "#6e4106" });
      return pattern;
    },
  };
  function applyPattern(patternName) {
    if (!adaptivePatterns[patternName]) {
      console.error(`Pattern "${patternName}" introuvable`);
      return;
    }

    resetGrid();

    const pattern = adaptivePatterns[patternName](gridSize);

    pattern.forEach((group) => {
      group.cells.forEach((cellId) => {
        if (cellId >= 1 && cellId <= gridSize * gridSize) {
          const cell = document.getElementById(`cell-${cellId}`);
          if (cell) {
            colorCell(cell, cellId, group.color);
          }
        }
      });
    });

    saveData();
    console.log(
      `Pattern "${patternName}" appliqué sur grille ${gridSize}x${gridSize}`
    );
  }

  function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const jsonData = JSON.parse(e.target.result);

        if (jsonData && typeof jsonData === "object") {
          if (jsonData.cellColors) cellColors = jsonData.cellColors;
          if (jsonData.cases) cases = jsonData.cases;
          if (typeof jsonData.click === "number") click = jsonData.click;
          if (typeof jsonData.gridSize === "number") {
            gridSize = jsonData.gridSize;
            gridSizeInput.value = gridSize;
          }

          saveData();
          generateTable();

          console.log("Fichier chargé avec succès!");
        } else {
          console.error("Format de fichier invalide");
          alert("Format de fichier invalide");
        }
      } catch (err) {
        console.error("Erreur lors du chargement du fichier :", err);
        alert(
          "Erreur lors du chargement du fichier. Vérifiez que le fichier est au bon format JSON."
        );
      }
    };

    reader.onerror = function () {
      console.error("Erreur lors de la lecture du fichier");
      alert("Erreur lors de la lecture du fichier");
    };

    reader.readAsText(file, "UTF-8");
  }

  function saveFile() {
    const data = {
      cellColors: cellColors,
      cases: cases,
      click: click,
      gridSize: gridSize,
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const dlAnchorElem = document.getElementById("downloadAnchorElem");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${fileName}.json`);
    dlAnchorElem.click();
  }

  // Event listeners
  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedSlider.value;
  });

  gridSizeInput.addEventListener("change", () => {
    updateGrid();
  });

  buttonTracer.addEventListener("click", () => {
    if (cases.length > 0) {
      tracerDebut([...cases]);
    }
  });

  document.getElementById("save").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("modalOverlay").style.display = "flex";
    document.getElementById("fileName").focus();
  });

  document
    .getElementById("modalCancelBtn")
    .addEventListener("click", function () {
      document.getElementById("modalOverlay").style.display = "none";
    });

  document
    .getElementById("modalSaveBtn")
    .addEventListener("click", function () {
      const Name = document.getElementById("fileName").value.trim();
      if (Name) {
        fileName = Name.replace(/[^a-zA-Z0-9_\-]/g, "_");
        document.getElementById("modalOverlay").style.display = "none";
        saveFile();
      } else {
        alert("Veuillez entrer un nom de fichier.");
      }
    });

  document
    .getElementById("modalOverlay")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        this.style.display = "none";
      }
    });

  document.getElementById("load").addEventListener("change", loadFile);
  document.getElementById("reset").addEventListener("click", resetGrid);
  document.getElementById("random").addEventListener("click", generateRandom);

  document.querySelectorAll(".preset-color").forEach((colorDiv) => {
    colorDiv.addEventListener("click", () => {
      const color = colorDiv.dataset.color;
      document.getElementById("color").value = color;
    });
  });

  document.querySelectorAll(".btn-pattern").forEach((btn) => {
    btn.addEventListener("click", () => {
      const patternName = btn.id;
      console.log(`Applying pattern: ${patternName}`);
      applyPattern(patternName);
    });
  });

  // Initialisation
  loadData();
  generateTable();
});
