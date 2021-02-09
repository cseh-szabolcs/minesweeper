/**
 * BoardGame-Model
 * Contains the logic for the board
 */
$.Class("Model.BoardGame", {
    
    COLS: 9,
    ROWS: 9,
    LENGTH: 0,
    MINES: 11,
    
    MARKER_FLAG: 1,
    MARKER_QUESTION: 2,
    
    /**
     * InnerClass Cell
     */
    Cell: function(id, x, y)
    {
        this.mine = false;
        this.open = false;
        this.badNeighborhood = 0;
        this.marker = false;
        this.style = false;
        this.id = id;
        this.x = x;
        this.y = y;
    }
    
},{
    
    id: '',
    controller: null,
    options: null,
    cells: null,
    mines: null,
    opened: 0,
    markerFlag: 0,
    
    
    /**
     * Initializes the board
     *
     * @param {Controller.Minesweeper}
     * @param {Object} options
     */
    init: function(controller, options)
    {
        this.controller = controller;
        this.id = this.controller.id
        this.options = options;
        
        // define cell-status
        Model.BoardGame.Cell.STATE_CLOSED = 1;
        Model.BoardGame.Cell.STATE_OPEN = 2;
        Model.BoardGame.Cell.STATE_FLAG = 3;
        Model.BoardGame.Cell.STATE_QUESTION = 4;
        Model.BoardGame.Cell.STATE_NUMBER = 5;
        Model.BoardGame.Cell.STATE_MINED = 6;
        Model.BoardGame.Cell.STATE_WRONG = 7;
        Model.BoardGame.Cell.STATE_OK = 8;
        
        // init
        this._initStageLevel();
        this._initCells();
        this._initMines();
        //this._initTest([[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]);
        this._initBadNeighborhood();
    },
    
    
    // ---------------------------------------------------------------
    // Init methods
    // ---------------------------------------------------------------
    
    
    /**
     * Sets the dimensions of the board, based on the level
     */
    _initStageLevel: function()
    {
        // Default level
        if (this.options.level === undefined) {
            this.options.level = 1;
        }
        
        // Level 1
        if (this.options.level == 1) {
            Model.BoardGame.COLS = 9;
            Model.BoardGame.ROWS = 9;
            Model.BoardGame.MINES = 11;
        }
        // Level 2
        else if (this.options.level == 2) {
            Model.BoardGame.COLS = 15;
            Model.BoardGame.ROWS = 15;
            Model.BoardGame.MINES = 40;
        }
        
        // Set CSS
        $("#minesweeper").css("width", Model.BoardGame.COLS*42+2);
    },
    
    
    
    /**
     * Generates the cells with all cell-information
     */
    _initCells: function()
    {
        Model.BoardGame.LENGTH = (Model.BoardGame.COLS * Model.BoardGame.ROWS);
        this.cells = new Array();
        for (var row=0; row<Model.BoardGame.ROWS; row++) {
            this.cells[row] = new Array();
            for (var col=0; col<Model.BoardGame.COLS; col++) {
                // core
                this.cells[row].push(new Model.BoardGame.Cell(row*Model.BoardGame.ROWS+col, col, row));
            }
        }
    },
    
    
    /**
     * Generates the mines by an random-strategy
     */
    _initMines: function()
    {
        this.mines = new Array();
        var mine, c=0;
        for (var i=0; i<Model.BoardGame.MINES; i++) {
            do {
                mine = Math.floor(Math.random()*Model.BoardGame.LENGTH);
                c++;
            } while (this.mines.indexOf(mine) != -1 || c>10000);
            // core
            this.mines.push(mine);
            this.getCell(mine).mine = true;
        }
        
        this.markerFlag = Model.BoardGame.MINES;
    },
    
    
    /**
     * Creates an sum-count of the neighbor-cells which have mines for every single cell
     */
    _initBadNeighborhood: function()
    {
        var neighbors;
        for (var row=0; row<Model.BoardGame.ROWS; row++) {
            for (var col=0; col<Model.BoardGame.COLS; col++) {
                // return, if the current cell has a mine anyway
                if (this.cells[row][col].mine == true) {
                    continue;
                }
                
                neighbors = this._getNeighborhood(row, col);
                
                // save result
                var bad=0;
                for (var i=0; i<neighbors.length; i++) {
                    if (neighbors[i].mine) {bad++;}
                }
                this.cells[row][col].badNeighborhood = bad;
            }
        }
    },
    
    
    // ---------------------------------------------------------------
    // Public methods
    // ---------------------------------------------------------------
    
    
    /**
     * Uncovers all neighbor-cells
     *
     * @param {int} id  : cell-id
     * @return {bool}
     */ 
    openCells: function(id)
    {
        var cell = this.getCell(id);
        
        // Ist die Zelle bereits geoeffnet oder markiert?
        if ((cell.open === true) || 
            (cell.marker === Model.BoardGame.MARKER_FLAG)
        ){
            return false;
        }
        // Ist die Zelle vermient?
        else if (cell.mine === true) {
            this.controller.onMinedField(cell.id);
            return false;
        }
        
        var col = cell.x;
        var row = cell.y;
        
        // core -> oeffne Zelle (und evtl. Nachbarzellen)
        this._setCellState(cell, Model.BoardGame.Cell.STATE_OPEN);
        if (this.cells[row][col].badNeighborhood > 0) {
            return true;
        }
        this._openCellsByWalkThrough(cell);
        return true;
    },
    
    
    /**
     * Toggle the marker of an cell
     *
     * @param {int} id  : cell-id
     */ 
    setMarker: function(id)
    {
        var cell = this.getCell(id);
        if (cell.open) {return;}
        
        // core
        switch (true) {
            // set question-mark
            case (cell.marker === Model.BoardGame.MARKER_FLAG):
                cell.marker = Model.BoardGame.MARKER_QUESTION;
                this._setCellState(cell, Model.BoardGame.Cell.STATE_QUESTION);
                this.markerFlag++;
                break;
            // remove marker-flag
            case (cell.marker === Model.BoardGame.MARKER_QUESTION):
                cell.marker = false;
                this._setCellState(cell, Model.BoardGame.Cell.STATE_CLOSED);
                break;
            // set marker-flag
            default:
                if (this.markerFlag === 0) {
                    break;
                }
                cell.marker = Model.BoardGame.MARKER_FLAG;
                this._setCellState(cell, Model.BoardGame.Cell.STATE_FLAG);
                this.markerFlag--;
                break;
        }
    },


    /**
     * Returns an cell based on id
     *
     * @param {int} id
     * @return {Object}
     */
    getCell: function(id)
    {
        var row = Math.floor(id/Model.BoardGame.ROWS);
        var col = (Model.BoardGame.COLS)-(Model.BoardGame.COLS*(row+1)-id);
        return this.cells[row][col];
    },
    
    
    /**
     * Uncovers all cells which contains a mine
     *
     * @param {int}  id         : cell-id where the game has ended
     */
    showTheBadGuys: function(id)
    {
        // show first cell
        if (id !== undefined) {
            var cell = this.getCell(id);
            this._setCellState(cell, Model.BoardGame.Cell.STATE_MINED);
            return;
        }
        
        // show the rest
        for (var row=0; row<Model.BoardGame.ROWS; row++) {
            for (var col=0; col<Model.BoardGame.COLS; col++) {

                // Richtige Tipps anzeigen
                if ((this.cells[row][col].marker === Model.BoardGame.MARKER_FLAG) &&
                    (this.cells[row][col].mine === true)
                ){
                    this._setCellState(this.cells[row][col], Model.BoardGame.Cell.STATE_OK, true);
                }
                // Mienfelder anzeigen
                if ((this.cells[row][col].marker !== Model.BoardGame.MARKER_FLAG) &&
                    (this.cells[row][col].mine === true)
                ){
                    this._setCellState(this.cells[row][col], Model.BoardGame.Cell.STATE_MINED, true);
                }
                // Falsche Tipps anzeigen
                if ((this.cells[row][col].marker === Model.BoardGame.MARKER_FLAG) &&
                    (this.cells[row][col].mine === false)
                ){
                    this._setCellState(this.cells[row][col], Model.BoardGame.Cell.STATE_WRONG, true);
                }
            }
         }
         this.controller.onGameOver();
    },
    
    
    // ---------------------------------------------------------------
    // Private methods
    // ---------------------------------------------------------------
    
    
    /**
     * Uncovers all cells
     *
     * @param {Object} cell     : Das Zellen-Objekt, auf das geklickt wurde
     */
    _openCellsByWalkThrough: function(cell)
    {
        var col = cell.x;
        var row = cell.y;
        
        var neighborhood = this._getNeighborhood(row, col, true);
        if (neighborhood.length !== 0) {
            for (var i=0; i<neighborhood.length; i++) {
                
                // core
                this._setCellState(neighborhood[i], Model.BoardGame.Cell.STATE_OPEN, true);
                if (neighborhood[i].badNeighborhood === 0) {
                    this._openCellsByWalkThrough(neighborhood[i]);
                }
            }
        }
    },
    
    
    /**
     * Retusn all neighbor-cells
     *
     * @param {int} col
     * @param {int} row
     * @param {bool} filter    : if true, only cells will be returned, which does not contains a mine
     * @return {Array[Cells]}
     */
    _getNeighborhood: function(row, col, filter)
    {
        var neighbors = new Array();
        if (col > 0) {neighbors.push(this.cells[row][col-1]);}
        if (col+1 < Model.BoardGame.COLS) {neighbors.push(this.cells[row][col+1]);}
        if (row>0) {
            neighbors.push(this.cells[row-1][col]);
            if (col > 0) {neighbors.push(this.cells[row-1][col-1]);}
            if (col+1 < Model.BoardGame.COLS) {neighbors.push(this.cells[row-1][col+1]);}
        }
        if (row+1 < Model.BoardGame.ROWS) {
            neighbors.push(this.cells[row+1][col]);
            if (col > 0) {neighbors.push(this.cells[row+1][col-1]);}
            if (col+1 < Model.BoardGame.COLS) {neighbors.push(this.cells[row+1][col+1]);}
        }
        
        // Filter -> nur unberührte Nachbarn zurückgeben
        if (filter !== undefined) {
            var filtredNeighbors = new Array();
            for (var i=0; i<neighbors.length; i++) {
                if ((neighbors[i].open === false) &&
                    (neighbors[i].marker !== Model.BoardGame.MARKER_FLAG)
                ){
                    filtredNeighbors.push(neighbors[i]);
                }
            }
            return filtredNeighbors;
        }
        return neighbors;
    },
    
    
    /**
     * Set cell-styling
     *
     * @param {Object} cell
     * @param {int} style
     * @param {bool} noAnimation
     */
    _setCellState: function(cell, style, noAnimation)
    {
        var src;
        switch (style) {
            case (Model.BoardGame.Cell.STATE_CLOSED):
                src = "img/bg_closed.png";
                break;
            case (Model.BoardGame.Cell.STATE_OPEN):
                if (cell.open === true) {return;}
                this.opened++;
                cell.open = true;
                if (cell.badNeighborhood > 0) {
                    this._setCellState(cell, Model.BoardGame.Cell.STATE_NUMBER, noAnimation);
                    return;
                }
                src = "img/bg_open.png";
                break;
            case (Model.BoardGame.Cell.STATE_FLAG):
                src = "img/bg_closed_flag.png";
                break;
            case (Model.BoardGame.Cell.STATE_QUESTION):
                src = "img/bg_closed_question.png";
                break;
            case (Model.BoardGame.Cell.STATE_NUMBER):
                src = "img/bg_open_"+cell.badNeighborhood+".png";
                break;
            case (Model.BoardGame.Cell.STATE_WRONG):
                src = "img/bg_wrong.png";
                break;
            case (Model.BoardGame.Cell.STATE_OK):
                src = "img/bg_ok.png";
                break;
            case (Model.BoardGame.Cell.STATE_MINED):
                if (cell.open === true) {return;}
                cell.open = true;
                src = "img/bg_mined.png";
                if (noAnimation === undefined) {
                    var $img = $(this.id+" li img."+cell.id);
                    var that = this;
                    $img.css("z-index", "9").attr("src", src).css("opacity","0").animate({
                        width:'60px', height:'60px', left:'-10px',top:'-10px', opacity:'1'
                    }, 300, function() {
                        $(this.id+" li img."+cell.id).parent().addClass('open');
                        $img.animate(
                            {width:'40px', height:'40px', left:'0px', top:'0px'},
                            300, that.showTheBadGuys()
                        );
                    });
                    return;
                }
                break;
        }
        cell.style = style;
        if (cell.open)
            $(this.id+" li img."+cell.id).parent().addClass('open');
        if (noAnimation === undefined)
            $(this.id+" li img."+cell.id).css("opacity","0").attr('src', src).animate({opacity:1},260);
        else
            $(this.id+" li img."+cell.id).attr('src', src);
    },
    
    
    /**
     * Set a mine for a cell manually (for testing-purposes)
     *
     * @param {Array[Array])
     */
    _initTest: function(cells) {
        for (var row=0; row<Model.BoardGame.ROWS; row++) {
            for (var col=0; col<Model.BoardGame.COLS; col++) {
                this.cells[row][col].mine = false;
                $("#minesweeper li."+this.cells[row][col].id).css("background", "blue");
            }
        }
        for (var c=0; c<cells.length; c++) {
            this.cells[cells[c][0]][cells[c][1]].mine = 
                true;$("#minesweeper li."+this.cells[cells[c][0]][cells[c][1]].id).css("background", "red");
        }
    }
    

});
