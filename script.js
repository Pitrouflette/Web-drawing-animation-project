document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('table');
    const buttonTracer = document.getElementById("tracer");
    const speedSlider = document.getElementById("speedSlider");
    
    let click = 0;
    let cases = [];
    let cellColors = {};
    let isAnimating = false;

    function loadData() {
        const savedCases = JSON.parse(localStorage.getItem("drawingCases") || "[]");
        const savedColors = JSON.parse(localStorage.getItem("drawingColors") || "{}");
        const savedClick = parseInt(localStorage.getItem("drawingClick") || "0");
        
        cases = savedCases;
        cellColors = savedColors;
        click = savedClick;
        
    }

    function saveData() {
        localStorage.setItem("drawingCases", JSON.stringify(cases));
        localStorage.setItem("drawingColors", JSON.stringify(cellColors));
        localStorage.setItem("drawingClick", click.toString());
    }

    function generateTable() {
        table.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const cell = document.createElement('td');
            cell.id = `cell-${i + 1}`;
            
            if (!table.rows[row]) {
                table.insertRow(row);
            }
            table.rows[row].insertCell(col).appendChild(cell);
            
            const cellId = i + 1;
            const caseIndex = cases.indexOf(cellId);
            if (caseIndex !== -1) {
                cell.style.color = cellColors[cellId] || "#000000";
                cell.innerText = caseIndex + 1;
            }
            
            cell.addEventListener("click", handleCellClick);
        }
    }

    function handleCellClick(event) {
        if (isAnimating) return;
        
        const cell = event.target;
        const cellId = parseInt(cell.id.replace('cell-', ''));
        const color = document.getElementById("color").value;
        const gomme = document.getElementById("gomme").checked;
        const fillModeActive = document.getElementById("fillMode").checked;

        if (gomme) {
            eraseCell(cell, cellId);
        } else if (fillModeActive) {
            fillArea(cellId, color);
        } else {
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

        while (queue.length > 0) {
            const currentId = queue.shift();

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            if (currentId < 1 || currentId > 100) continue;
            
            const currentCell = document.getElementById(`cell-${currentId}`);
            if (!currentCell) continue;
            
            const currentCellColor = cellColors[currentId] || null;
            const isCurrentEmpty = !cases.includes(currentId);
            const shouldFill = (isOriginalEmpty && isCurrentEmpty) || 
                              (!isOriginalEmpty && !isCurrentEmpty && currentCellColor === originalColor);
            
            if (shouldFill) {
                cellsToFill.push(currentId);

                const row = Math.floor((currentId - 1) / 10);
                const col = (currentId - 1) % 10;

                const neighbors = [];
                
                if (row > 0) neighbors.push((row - 1) * 10 + col + 1);
                if (row < 9) neighbors.push((row + 1) * 10 + col + 1);
                if (col > 0) neighbors.push(row * 10 + col);
                if (col < 9) neighbors.push(row * 10 + col + 2);

                neighbors.forEach(neighborId => {
                    if (!visited.has(neighborId)) {
                        queue.push(neighborId);
                    }
                });
            }
        }

        cellsToFill.forEach(id => {
            const cell = document.getElementById(`cell-${id}`);
            const wasAlreadyPainted = cases.includes(id);
            
            if (wasAlreadyPainted) {
                click += 1
                cell.style.color = newColor;
                cell.innerText = click + 1
                cellColors[id] = newColor;
            } else {
                colorCell(cell, id, newColor);
            }
        });
    }

    async function tracer(cellId) {
        const speed = parseInt(speedSlider.value);
        return new Promise(resolve => {
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

    const patterns = {
        smiley: [
            {cells: [14,24,34], color: "#f6e05e"},
            {cells: [17,27,37], color: "#f6e05e"},
            {cells: [52, 53, 63, 64, 74, 75, 76, 77, 67, 68, 58, 59], color: "#f6e05e"}
        ],
        heart: [
            {cells: [13, 17], color: "#ce0d0d"},
            {cells: [22, 23, 24, 26, 27, 28], color: "#ce0d0d"},
            {cells: [31, 32, 33, 34, 35, 36, 37, 38, 39], color: "#ce0d0d"},
            {cells: [42, 43, 44, 45, 46, 47, 48], color: "#ce0d0d"},
            {cells: [53, 54, 55, 56, 57], color: "#ce0d0d"},
            {cells: [64, 65, 66], color: "#ce0d0d"},
            {cells: [75], color: "#ce0d0d"}
        ],
        star: [
            { cells: [6, 15, 16, 17, 25, 26, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 46, 48, 49, 54, 56, 58, 64, 65, 66, 67, 68, 73, 74, 75, 77, 78, 79, 83, 84, 88, 89], color: "#f6e05e" },
            { cells: [45, 55, 47, 57], color: "#000000" },
        ],
        tree: [
            {cells: [25, 34, 35, 36, 43, 44, 45, 46, 47, 53, 54, 55, 56, 57, 63, 64, 65, 66, 67], color: "#4fd176"},
            {cells: [75, 84, 85, 86], color: "#6e4106"}
        ],
        thumbs_up: [
            {cells: [6, 15, 17, 25, 27,34, 37, 38, 39,44, 50, 51, 52, 53,59, 60, 61, 63,70, 71, 73, 79,80, 81, 83, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99], color: "#000000"},
            {cells: [16, 26,35, 36,45, 46, 47, 48, 49,54, 55, 56, 57, 58,62, 64, 65, 66, 67, 68, 69,72, 74, 75, 76, 77, 78,82, 84, 85, 86, 87, 88, 89], color: "#f6e05e"}
        ],
        landscape: [
            {cells: [1, 2, 3,11, 12, 13,21, 22], color: "#f6e05e"},
            {cells: [4, 5, 6, 7, 8, 9, 10,14, 15, 16, 17, 18, 19, 20,23, 24, 25, 26, 27, 28, 29, 30,31, 32, 33, 34, 35, 36, 37, 38,40, 41, 42, 43, 44, 45, 46, 47,51, 52, 53, 54, 55, 56, 57,61, 62, 63, 64, 65, 66, 67, 68,70, 71, 72, 73, 74, 75, 76, 77, 78,80], color: "#87ceeb"},
            {cells: [39,48, 49, 50,58, 59, 60,81, 82, 83, 84, 85, 86, 87, 88, 89,90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100], color: "#4fd176"},
            {cells: [69, 79], color: "#6e4106"}
        ]
    };

    function applyPattern(patternName) {
        if (!patterns[patternName]) return;
        
        resetGrid();
        const pattern = patterns[patternName];
        
        pattern.forEach(group => {
            group.cells.forEach(cellId => {
                const cell = document.getElementById(`cell-${cellId}`);
                if (cell) {
                    colorCell(cell, cellId, group.color);
                }
            });
        });
        
        saveData();
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
        const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd"];
        const numCells = Math.floor(Math.random() * 20) + 30;
        
        for (let i = 0; i < numCells; i++) {
            const cellId = Math.floor(Math.random() * 100) + 1;
            const cell = document.getElementById(`cell-${cellId}`);
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            if (cell && cell.innerText === "") {
                colorCell(cell, cellId, color);
            }
        }
        saveData();
    }

    function loadFile(event) {
        var reader = new FileReader();
        const file = event.target.files[0];
        if (!file) return;
        reader.readAsText(file, 'UTF-8');
        reader.onload = function(ev) {
            try {
                const jsonData = ev.target.result;
                cellColors = jsonData.cellColors;
                cases = jsonData.cases;
                click = jsonData.click;
                saveData();
                location.reload();
            } catch (err) {
                console.error("Erreur lors du chargement du fichier :", err);
            }
        };
    }
    
    function saveFile() {
        saveData();
        location.reload();
        const data = {
            cellColors: cellColors,
            cases: cases,
            click: click
        };
    
        const jsonStr = JSON.stringify(data);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
        const dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "test.json");
        dlAnchorElem.click();
    }
    
    buttonTracer.addEventListener("click", () => {
        if (cases.length > 0) {
            tracerDebut([...cases]);
        }
    });

    document.getElementById("load").addEventListener("click", loadFile);

    document.getElementById("save").addEventListener("click", () => {
        saveFile()
    });

    document.getElementById("reset").addEventListener("click", () => {
        resetGrid();
    });

    document.getElementById("random").addEventListener("click", () => {
        generateRandom();
    });

    document.querySelectorAll('.preset-color').forEach(colorDiv => {
        colorDiv.addEventListener('click', () => {
            const color = colorDiv.dataset.color;
            document.getElementById('color').value = color;
        });
    });

    Object.keys(patterns).forEach(patternName => {
        document.getElementById(patternName).addEventListener('click', () => {
            applyPattern(patternName);
        });
    });

    loadData();
    generateTable();
});