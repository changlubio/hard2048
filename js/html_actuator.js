function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.setupMode = function (isSetupMode) {
  var setupControls = document.querySelector(".setup-controls");
  var gameContainer = document.querySelector(".game-container");

  console.log("Setup mode:", isSetupMode);

  if (isSetupMode) {
    setupControls.style.display = "block";
    gameContainer.classList.add("setup-mode");
    this.setupGridClickHandlers();
    this.setupTileValueHandlers();

    // Make sure the default value (2) is properly set
    if (window.gameManager) {
      var activeButton = document.querySelector(".tile-value-btn.active");
      if (activeButton) {
        var value = parseInt(activeButton.getAttribute("data-value"));
        window.gameManager.setSelectedTileValue(value);
        console.log("Setup mode: Default value set to", value);
      }
    }
  } else {
    setupControls.style.display = "none";
    gameContainer.classList.remove("setup-mode");
    this.removeGridClickHandlers();
  }
};

HTMLActuator.prototype.setupGridClickHandlers = function () {
  var self = this;
  var gridRows = document.querySelectorAll(".grid-row");

  gridRows.forEach(function (row, rowIndex) {
    var cellsInRow = row.querySelectorAll(".grid-cell");
    cellsInRow.forEach(function (cell, colIndex) {
      var handleGridTap = function (event) {
        event.preventDefault();
        console.log("Grid cell tapped:", { x: colIndex, y: rowIndex });
        self.handleGridClick({ x: colIndex, y: rowIndex });
      };

      cell.addEventListener("click", handleGridTap);
      cell.addEventListener("touchend", handleGridTap);
    });
  });
};

HTMLActuator.prototype.removeGridClickHandlers = function () {
  var gridCells = document.querySelectorAll(".grid-cell");

  gridCells.forEach(function (cell) {
    cell.onclick = null;
  });
};

HTMLActuator.prototype.handleGridClick = function (position) {
  // Emit placeTile event
  if (window.gameManager) {
    window.gameManager.placeTile(position);
  }
};

HTMLActuator.prototype.setupTileValueHandlers = function () {
  var self = this;
  var valueButtons = document.querySelectorAll(".tile-value-btn");

  valueButtons.forEach(function (button) {
    // Use both click and touchend for better mobile support
    var handleSelection = function (event) {
      event.preventDefault();
      console.log("Tile value button selected:", button.getAttribute("data-value"));

      // Remove active class from all buttons
      valueButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });

      // Add active class to clicked button
      button.classList.add("active");

      // Set selected tile value
      var value = parseInt(button.getAttribute("data-value"));
      if (window.gameManager) {
        window.gameManager.setSelectedTileValue(value);
        console.log("Selected tile value set to:", value);
      }
    };

    button.addEventListener("click", handleSelection);
    button.addEventListener("touchend", handleSelection);
  });
};
