/**
 * Initialize the application (bootstrap)
 */
$(document).ready(function()
{

    (function() {
        // Load controller and model
        load('js/controllers/minesweeper');
        load('js/models/boardgame');
        load('js/models/gamereferee');

        // Start
        new Controller.Minesweeper($('#minesweeper'));
    })();
});
