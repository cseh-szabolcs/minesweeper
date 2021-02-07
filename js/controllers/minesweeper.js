/* 
 * Minesweeper-Controller
 * Enthaelt die Steuerung fuer das Spiel
 */
$.Controller('Controller.Minesweeper',{
    instance: null
},{
    
    id: "#minesweeper",
    boardGame: null,
    gameReferee: null,
    
    
    /**
     * Init
     */
    init: function(options)
    {     
        if (!Model.GameReferee.browserCheck()) {return;}
        Controller.Minesweeper.instance = this;
        
        // Render HTML (header)
        $('#minesweeper .header').html('js/views/header.ejs', {
            display:'game'
        });
        
        // Init game
        this.boardGame = new Model.BoardGame(this, options);
        // Init refree
        this.gameReferee = new Model.GameReferee(this, this.boardGame);
        this.gameReferee.checkGame();
        
        
        // Render HTML (main, footer)
        $('#minesweeper .main').html('js/views/minesweeper.ejs', {
            cols: Model.BoardGame.COLS,
            rows: Model.BoardGame.ROWS
        });
        $('#minesweeper .footer').html('js/views/footer.ejs', {
            level: this.boardGame.options.level
        });
        // Reset background
        $('#minesweeper').colorBlend("stop", "all").css({backgroundColor:'white'});
    },
    
    
    /**
     * Users clicks on an cell
     */
    "li img click": function($el, ev)
    {
        if (this.gameReferee.state !== Model.GameReferee.GAME_RUNNING) {return;}
        var cellId = $el.attr('class');
        if (this.boardGame.openCells(cellId)) {
            this.gameReferee.startClock();
            this.gameReferee.checkGame(cellId);
        }
    },
    
    
    /**
     * User marks a cell
     */
    "li img contextmenu": function($el, ev)
    {
        if (this.gameReferee.state !== Model.GameReferee.GAME_RUNNING) {return false;}
        var cellId = $el.attr('class');
        this.boardGame.setMarker(cellId);
        this.gameReferee.updateHeader();
        return false;
    },
    
    
    /**
     * User clicked on a call, which has an mine
     */
    onMinedField: function(cellId)
    {
        this.boardGame.showTheBadGuys(cellId);
    },
    
    
    /**
     * Game over, user has lost
     */
    onGameOver: function()
    {
        this.gameReferee.endClock();
        $('#minesweeper .header').html('js/views/header.ejs', {
            display: 'gameOver'
        });
        this.gameReferee.getAndResetGametime();
        // change background-color
        $('#minesweeper').colorBlend([
            {param:'background-color', colorList:['white', '#ff915a'],
                cycles:1, duration: 300, strobe:false}
        ]);
    },
    
    
    /**
     * The game is won
     */
    onGameWon: function()
    {
        this.gameReferee.endClock(true);
        $('#minesweeper .header').html('js/views/header.ejs', {
            display: 'gameWon',
            gameTime: this.gameReferee.getAndResetGametime()
        });
        // change background-color
        $('#minesweeper').colorBlend([
            {param:'background-color', colorList:['white', '#87cf87'], 
                cycles:1, duration: 300, strobe:false}
        ]);
    },
    
    
    /**
     * Create a new game
     */
    onNewGame: function()
    {
        this.init({level:this.boardGame.options.level});
    },
    
    
    /**
     * Select an difficult level
     */
    onNewGameLevel: function()
    {
        var gameLevel = $('#minesweeper .footer input:checked').val();
        if (this.gameReferee.gameTime > 0) {
            if (confirm('Stop current Game?')) {
                this.init({level: gameLevel});
            }
            return;
        }
        this.init({level: gameLevel});
    },
    
  
    /**
     * Hide context-menu on the cells
     */
    "#minesweeper .main contextmenu": function($el, ev)
    {
        ev.preventDefault();
        return false;
    }
    
    
});
