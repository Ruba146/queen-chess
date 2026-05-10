const express = require("express");
const router = express.Router();

const Game = require("../models/Games");
const auth = require("../middleware/authMiddleware");

const { Chess } = require("chess.js");

// 🔥 classify move
function classifyMove(loss){

    if(loss <= 10)
        return "Best";

    if(loss <= 30)
        return "Excellent";

    if(loss <= 60)
        return "Good";

    if(loss <= 100)
        return "Inaccuracy";

    if(loss <= 250)
        return "Mistake";

    return "Blunder";
}

// 🔥 analysis route
router.get("/:id", auth, async (req, res) => {

    try{

        const gameData =
            await Game.findById(req.params.id);

        if(!gameData){

            return res.status(404).json({
                message:"Game not found"
            });

        }

        const chess = new Chess();

        let analysis = [];

        let mistakes = 0;
        let blunders = 0;

        let totalLoss = 0;

        for(let i = 0; i < gameData.moves.length; i++){

            const move =
                gameData.moves[i];

            // 🔥 مؤقتًا fake eval
            const bestEval =
                Math.random() * 100;

            const playedEval =
                Math.random() * 100;

            const loss =
                Math.abs(
                    bestEval - playedEval
                );

            totalLoss += loss;

            const classification =
                classifyMove(loss);

            if(classification === "Mistake")
                mistakes++;

            if(classification === "Blunder")
                blunders++;

            analysis.push({

                moveNumber:i + 1,

                move,

                classification,

                loss:Math.round(loss)

            });

            chess.move(move);

        }

        // 🔥 accuracy
        const avgLoss =
            totalLoss / gameData.moves.length;

        const accuracy =
            Math.max(
                0,
                Math.round(100 - avgLoss / 2)
            );

        // 🔥 weakness
        let weakness =
            "Good player 👍";

        if(blunders >= 3){

            weakness =
                "You lose pieces under pressure";

        }
        else if(mistakes >= 3){

            weakness =
                "You make inaccurate moves";

        }

        // 🔥 opening detect
        let opening =
            "Unknown Opening";

        const firstMoves =
            gameData.moves
            .slice(0,6)
            .join(" ");

        if(firstMoves.includes("e4 e5 Nf3 Nc6 Bb5")){

            opening = "Ruy Lopez";

        }
        else if(firstMoves.includes("e4 c5")){

            opening = "Sicilian Defense";

        }
        else if(firstMoves.includes("d4 d5 c4")){

            opening = "Queen's Gambit";

        }

        // 🔥 final response
        res.json({

            result:gameData.result,

            totalMoves:
                gameData.moves.length,

            accuracy,

            mistakes,

            blunders,

            weakness,

            opening,

            analysis

        });

    }
    catch(err){

        console.log(err);

        res.status(500).json({
            message:"Server error"
        });

    }

});

module.exports = router;