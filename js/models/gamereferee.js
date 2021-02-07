/**
 * BoardGame-Model
 * The "referee" checks, if the game is won or lost (or can be lost)
 */
$.Class("Model.GameReferee", {
    
    GAME_RUNNING: 0,
    GAME_WON: 1,
    GAME_LOST: 2,
    timeOut: null,
    
    /**
     * Check browser-support-check (legacy code)
     * @return bool
     */
    browserCheck: function()
    {
        if (($.browser.msie) && (parseInt($.browser.version) < 9)) {
            $('#minesweeper').html('js/views/wrongbrowser.ejs', {});
            return false;
        }
        return true;
    }
},{
    
    id: '',
    boardGame: null,
    controller: null,
    state: -1,
    gameTime: 0,
    
    visuals: {
        $time: null,
        $markerFlag: null,
        $mines: null  
    },
    
    
    /**
     * @param {Controller.Minesweeper} controller
     * @param {Model.BoardGame} boardGame
     */
    init: function(controller, boardGame)
    {
        this.controller = controller;
        this.boardGame = boardGame
        
        this.id = this.controller.id;
        
        this._initHeaderElements();
        this.state = Model.GameReferee.GAME_RUNNING;
    },
    
    
    // ---------------------------------------------------------------
    // Init methods
    // ---------------------------------------------------------------
    
    /**
     * 
     */
    _initHeaderElements: function()
    {
        this.visuals.$time = $('#minesweeperTime');
        this.visuals.$markerFlag = $('#minesweeperFlags');
        this.visuals.$mines = $('#minesweeperMines');
        
        this.endClock();
    },
    
    
    // ---------------------------------------------------------------
    // Public methods
    // ---------------------------------------------------------------
    
    /**
     * Core: Checks, if all cells which contains a mine are uncovered
     */
    checkGame: function()
    {
        // Ist das Spiel gewonnen?
        if ((Model.BoardGame.LENGTH - Model.BoardGame.MINES) == 
            (this.boardGame.opened)
        ){
            this.controller.onGameWon();
        }
        
        // Header aktualisieren
        this.updateHeader();
    },
    
    
    /**
     * Shows all counters like uncovered mines, etc. in the top-bar
     */
    updateHeader: function()
    {
        this.visuals.$markerFlag.html(this.boardGame.markerFlag);
        this.visuals.$mines.html(Model.BoardGame.MINES);
    },
    
    
    /**
     * Starts the timer
     */
    startClock: function()
    {
        if (Model.GameReferee.timeOut === null) {
            this._updateClock();
        }
    },
    
    
    /**
     * Stops the timer
     *
     * @param {int} gameWon
     */
    endClock: function(gameWon)
    {
        if (Model.GameReferee.timeOut !== null) {
            window.clearTimeout(Model.GameReferee.timeOut); 
        }
        Model.GameReferee.timeOut = null;
        if (gameWon !== undefined) {
            this.state = Model.GameReferee.GAME_WON;
        } else {
            this.state = Model.GameReferee.GAME_LOST;
        }
    },
    
    
    /**
     * Returns the time and resets the clock
     */
    getAndResetGametime: function()
    {
        var gameTime = this.gameTime;
        this.gameTime = 0;
        return gameTime--;
    },
    
    
    // ---------------------------------------------------------------
    // Private methods
    // ---------------------------------------------------------------
    
    /**
     * Updates the clock every second and shows the value in the header
     */
    _updateClock: function()
    {
        this.visuals.$time.html(this.gameTime);
        this.gameTime++;
        var that = this;
        Model.GameReferee.timeOut = window.setTimeout(function(){
            that._updateClock();
        }, 1000);
    }

});
