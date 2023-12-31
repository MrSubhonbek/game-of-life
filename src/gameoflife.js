"use strict";

let _typeof =
    typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
        ? function (obj) {
            return typeof obj;
        }
        : function (obj) {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol
                ? "symbol"
                : typeof obj;
        };

let _createClass = (function () {
    function defineProperties(target, props) {
        for (let i = 0; i < props.length; i++) {
            let descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

let GameOfLife = (function () {
    let Helpers = (function () {
        function Helpers() {
            _classCallCheck(this, Helpers);
        }

        _createClass(Helpers, null, [
            {
                key: "getPosition",
                value: function getPosition(element) {
                    let left = 0,
                        top = 0;

                    if (element.offsetParent) {
                        do {
                            left += element.offsetLeft;
                            top += element.offsetTop;
                        } while ((element = element.offsetParent));
                    }

                    return [left, top];
                },
            },
            {
                key: "mod",
                value: function mod(n, m) {
                    return ((m % n) + n) % n;
                },
            },
        ]);

        return Helpers;
    })();

    let State = (function () {
        class State {
            constructor(config) {
                _classCallCheck(this, State);

                this.config = config;

                let col = this.config.num_cols,
                    row;

                this.cells = [];
                this.changes = [];

                while (col--) {
                    this.cells[col] = [];

                    row = this.config.num_rows;
                    while (row--) {
                        this.cells[col][row] = 0;
                    }
                }
            }
        }

        _createClass(State, [
            {
                key: "changeCell",
                value: function changeCell(col, row) {
                    this.cells[col][row] = !this.cells[col][row];

                    return this.cells[col][row];
                },
            },
            {
                key: "computeNextState",
                value: function computeNextState() {
                    let count = 0,
                        col,
                        row,
                        rowOffset,
                        colOffset,
                        neighborCol,
                        neighborRow;

                    this.changes = [];

                    // iterate over all cells
                    col = this.config.num_cols;
                    while (col--) {
                        row = this.config.num_rows;
                        while (row--) {
                            count = 0;

                            // iterate over all neighbors in Moore neighborhood with radius=1
                            for (colOffset = -1; colOffset <= 1; ++colOffset) {
                                for (rowOffset = -1; rowOffset <= 1; ++rowOffset) {
                                    if (colOffset == 0 && rowOffset == 0) {
                                        continue;
                                    }

                                    neighborCol = col + colOffset;
                                    if (neighborCol < 0 || neighborCol >= this.config.num_cols) {
                                        neighborCol = Helpers.mod(
                                            this.config.num_cols,
                                            neighborCol
                                        );
                                    }

                                    neighborRow = row + rowOffset;
                                    if (neighborRow < 0 || neighborRow >= this.config.num_rows) {
                                        neighborRow = Helpers.mod(
                                            this.config.num_rows,
                                            neighborRow
                                        );
                                    }

                                    // count neighbors that are "on" or "alive"
                                    if (this.cells[neighborCol][neighborRow]) {
                                        count++;
                                    }
                                }
                            }

                            // determine state of new cells
                            // die if under- or overpopulated
                            if ((count < 2 || count > 3) && this.cells[col][row]) {
                                this.changes.push({ col: col, row: row });
                                // come to life if exactly 3 neighbors
                            } else if (count == 3 && !this.cells[col][row]) {
                                this.changes.push({ col: col, row: row });
                            }
                        }
                    }

                    return this.changes;
                },
            },
        ]);

        return State;
    })();

    let Canvas = (function () {
        class Canvas {
            constructor(config, state) {
                _classCallCheck(this, Canvas);

                this.config = config;
                this.state = state;

                this.canvas = document.getElementById(this.config.canvas_id);

                if (this.canvas == null) {
                    throw new Error("Canvas element could not be found.");
                }

                this.context = this.canvas.getContext("2d");

                if (!this.context) {
                    throw new Error("Canvas context could not be retrieved.");
                }

                this.canvas.width = this.config.num_cols * this.config.cell_size + 1;
                this.canvas.height = this.config.num_rows * this.config.cell_size + 1;

                // clear the canvas
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

                // fill the background
                this.context.fillStyle = this.config.color_cell_dead;
                this.context.strokeStyle = this.config.color_lines;
                this.context.fillRect(
                    1,
                    1,
                    this.canvas.width - 1,
                    this.canvas.height - 1
                );

                // vertical lines
                for (let x = 0; x <= this.canvas.width; x += this.config.cell_size) {
                    this.context.moveTo(0.5 + x, 0);
                    this.context.lineTo(0.5 + x, this.canvas.width);
                }

                // horizontal lines
                for (let y = 0; y <= this.canvas.width; y += this.config.cell_size) {
                    this.context.moveTo(0, 0.5 + y);
                    this.context.lineTo(this.canvas.width, 0.5 + y);
                }

                // draw it
                this.context.stroke();
            }
        }

        _createClass(Canvas, [
            {
                key: "_handleClick",
                value: function _handleClick(e) {
                    let cell = this._getCellFromCursorPosition(e);

                    if (cell == false) {
                        return;
                    }

                    let cellState = this.state.changeCell(cell[0], cell[1]);

                    this._drawCell(cell[0], cell[1], cellState);
                },
            },
            {
                key: "_getCellFromCursorPosition",
                value: function _getCellFromCursorPosition(e) {
                    let left, top;

                    if (typeof e.pageX != "undefined" && typeof e.pageY != "undefined") {
                        left = e.pageX;
                        top = e.pageY;
                    } else {
                        left =
                            e.clientX +
                            document.body.scrollLeft +
                            document.documentElement.scrollLeft;
                        top =
                            e.clientY +
                            document.body.scrollTop +
                            document.documentElement.scrollTop;
                    }

                    let canvas_offset = Helpers.getPosition(this.canvas);
                    left -= canvas_offset[0];
                    top -= canvas_offset[1];

                    if (
                        left > this.config.num_cols * this.config.cell_size ||
                        top > this.config.num_rows * this.config.cell_size
                    ) {
                        return false;
                    }

                    return [
                        Math.floor(left / this.config.cell_size),
                        Math.floor(top / this.config.cell_size),
                    ];
                },
            },
            {
                key: "_drawCell",
                value: function _drawCell(col, row, cellState) {
                    if (cellState) {
                        this.context.fillStyle = this.config.color_cell_alive;
                    } else {
                        this.context.fillStyle = this.config.color_cell_dead;
                    }

                    // fill rectangle from (col-1,row-1) with width and height of cellSize-1
                    this.context.fillRect(
                        1 + col * this.config.cell_size,
                        1 + row * this.config.cell_size,
                        this.config.cell_size - 1,
                        this.config.cell_size - 1
                    );
                },
            },
        ]);

        return Canvas;
    })();

    let GameOfLife = (function () {
        class GameOfLife {
            constructor(customConfig) {
                _classCallCheck(this, GameOfLife);

                this._defaults = {
                    canvas_id: "gameoflife_canvas",
                    num_cols: 80,
                    num_rows: 40,
                    cell_size: 10,
                    color_lines: "#cccccc",
                    color_cell_dead: "#ffffff",
                    color_cell_alive: "#57A0DB",
                    update_interval: 50,
                };
                this._interval = null;

                this.config = this._buildConfig(customConfig);
                this.state = new State(this.config);
                this.canvas = new Canvas(this.config, this.state);
                this._setEventListeners();
            }
        }

        _createClass(GameOfLife, [
            {
                key: "_buildConfig",
                value: function _buildConfig(customConfig) {
                    let i;

                    let config = this._defaults;

                    if (
                        (typeof customConfig === "undefined"
                            ? "undefined"
                            : _typeof(customConfig)) != "object"
                    ) {
                        return config;
                    }

                    for (i in customConfig) {
                        if (
                            typeof config[i] == "undefined" ||
                            _typeof(customConfig[i]) == "object"
                        ) {
                            continue;
                        }
                        config[i] = customConfig[i];
                    }

                    return config;
                },
            },
            {
                key: "_setEventListeners",
                value: function _setEventListeners() {
                    let self = this;

                    this.canvas.canvas.addEventListener(
                        "click",
                        function (e) {
                            self.canvas._handleClick(e);
                        },
                        false
                    );
                },
            },
            {
                key: "setState",
                value: function setState(cells) {
                    let i, cellState;
                    console.log(cells);
                    this.stop();

                    if (cells.length == 0) {
                        return;
                    }

                    for (i = 0; i < cells.length; i++) {
                        cellState = this.state.changeCell(cells[i].col, cells[i].row);
                        this.canvas._drawCell(cells[i].col, cells[i].row, cellState);
                    }
                },
            },
            {
                key: "reset",
                value: function reset() {
                    this.stop();

                    this.state = new State(this.config);
                    this.canvas = new Canvas(this.config, this.state);
                },
            },
            {
                key: "start",
                value: function start() {
                    if (this._interval != null) {
                        return;
                    }

                    let self = this,
                        i,
                        cellState;

                    this._interval = setInterval(function () {
                        let changes = self.state.computeNextState();

                        if (changes.length == 0) {
                            self.stop();
                            return;
                        }

                        for (i = 0; i < changes.length; i++) {
                            cellState = self.state.changeCell(changes[i].col, changes[i].row);
                            self.canvas._drawCell(changes[i].col, changes[i].row, cellState);
                        }
                    }, this.config.update_interval);
                },
            },
            {
                key: "step",
                value: function step() {
                    let changes, cellState, i;

                    this.stop();

                    changes = this.state.computeNextState();

                    if (changes.length == 0) {
                        return;
                    }

                    for (i = 0; i < changes.length; i++) {
                        cellState = this.state.changeCell(changes[i].col, changes[i].row);
                        this.canvas._drawCell(changes[i].col, changes[i].row, cellState);
                    }
                },
            },
            {
                key: "stop",
                value: function stop() {
                    clearInterval(this._interval);
                    this._interval = null;
                },
            },
            {
                key: "setRandomPoint",
                value: function setRandomPoint() {
                    let cellState;
                    for (let i = 0; i < this.config.num_cols; i++)
                        for (let j = 0; j < this.config.num_rows; j++) {
                            if (Math.random() > 0.5) {
                                cellState = this.state.changeCell(i, j);
                                this.canvas._drawCell(i, j, cellState);
                            }
                        }
                },
            },
        ]);

        return GameOfLife;
    })();

    return GameOfLife;
})();
