describe("Turtle", function () {
    'use strict';
    var builtinRead = function (x) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return Sk.builtinFiles["files"][x];
        },
        c = document.createElement('canvas'),
        ref = document.createElement('canvas'),
        loadImage = function (file) {
            var a = new Image();
            a.src = file;
            a.addEventListener('load', function () {
                ref.getContext('2d').drawImage(a, 0, 0);
            });
        };
        
    beforeEach(function () {
        jasmine.addMatchers(imagediff.jasmine);
        TurtleGraphics = { doneDelegates: [] };
        Sk.configure({
            output: function(s) {
                console.log(s);
            },
            read: builtinRead
        });
        c.id = "turtlecanvas";
        c.width = "200";
        c.height = "200";
        c.style.display = "none";
        ref.id = "reffw100";
        ref.width = "200";
        ref.height = "200";
        document.body.appendChild(c);
        Sk.canvas = "turtlecanvas";
    });
    
    afterEach(function () {
        c.style.display = "none";
        c.getContext('2d').clearRect(0, 0, 200, 200);
    });
    
    it("should be able to draw the example on the home page", function (done) {
        var cctx = c.getContext("2d"),
            code = "import turtle\nt = turtle.Turtle()\nc = [ \"red\", \"green\", \"blue\", \"yellow\" ]\nfor color in c:\n    t.color(color)\n    t.forward(50)\n    t.left(360/len(c))",
            refctx = ref.getContext("2d");
        loadImage("data:image/png;base64,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");
        Sk.importMainWithBody("", false, code);
        TurtleGraphics.doneDelegates.push(function () {
            //1 for tolerance
            expect(cctx).toImageDiffEqual(refctx, 1);
            done();
        });
    });
    
    it("should be able to move 50 px forward", function (done) {
        var cctx = c.getContext("2d"),
            code = "import turtle\nt = turtle.Turtle()\nt.forward(50)",
            refctx = ref.getContext("2d");
        loadImage("data:image/png;base64,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");
        Sk.importMainWithBody("", false, code);
        TurtleGraphics.doneDelegates.push(function () {
            expect(cctx).toImageDiffEqual(refctx);
            done();
        });
    });
    
    it("should be able to change the color", function (done) {
        var cctx = c.getContext("2d"),
            code = "import turtle\nt = turtle.Turtle()\nt.color('red')\nt.forward(50)",
            refctx = ref.getContext("2d");
        loadImage("data:image/png;base64,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");
        Sk.importMainWithBody("", false, code);
        TurtleGraphics.doneDelegates.push(function () {
            expect(cctx).toImageDiffEqual(refctx);
            done();
        });
    });
    
    it("should be able to draw a circle", function (done) {
        var cctx = c.getContext("2d"),
            code = "import turtle\nt = turtle.Turtle()\nt.circle(50, 360)",
            refctx = ref.getContext("2d");
        loadImage("data:image/png;base64,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tsuchoTgi/GmldRJcRH/4yocyWpi7OFjE2QP8M5QZdDOIO+E8Jeu6onBz5fYXb2hSH5fiMJbJpBCOAY/8+b/KCTFeiIpSIgFZL332lCk/70NARNkG0Lx70sgM5gp9d4lnuux5j9xyY2+ZSWrNjJ1HicRMEH6iwgS5lZIeZpxW8nsEepBTyLwM4U9xC7DsW1l+fsNCJgg/YYGh0B88cFZieeg5hDOHZxGgoAJ0p8j2INsmqRzyZfEcK/Qnz8alWSCNIKplZvYO6wv83I5mP9ftVKCM2kdAROkdUg3ZkgSlIm6N+36w32vkkyQveDbSZkTay7Xcs+kr6MmO1XQN59GwARxVBiBSyBggjg8jIAJ4hgwAjEE3IPEcLOWCAImiIijbWYMARMkhpu1RBAwQUQcbTNjCJggMdysJYKACSLiaJsZQ8AEieFmLREETBARR9vMGAImSAw3a4kgYIKIONpmxhAwQWK4WUsEARNExNE2M4aACRLDzVoiCJggIo62mTEETJAYbtYSQcAEEXG0zYwhYILEcLOWCAImiIijbWYMARMkhpu1RBAwQUQcbTNjCJggMdysJYKACSLiaJsZQ8AEieFmLREETBARR9vMGAImSAw3a4kgYIKIONpmxhAwQWK4WUsEARNExNE2M4aACRLDzVoiCJggIo62mTEETJAYbtYSQcAEEXG0zYwhYILEcLOWCAImiIijbWYMARMkhpu1RBAwQUQcbTNjCJggMdysJYKACSLiaJsZQ8AEieFmLREETBARR9vMGAImSAw3a4kgYIKIONpmxhAwQWK4WUsEARNExNE2M4aACRLDzVoiCJggIo62mTEETJAYbtYSQcAEEXG0zYwhYILEcLOWCAImiIijbWYMARMkhpu1RBAwQUQcbTNjCJggMdysJYKACSLiaJsZQ8AEieFmLREETBARR9vMGAImSAw3a4kgYIKIONpmxhAwQWK4WUsEARNExNE2M4aACRLDzVoiCJggIo62mTEETJAYbtYSQcAEEXG0zYwhYILEcLOWCAImiIijbWYMARMkhpu1RBAwQUQcbTNjCJggMdysJYKACSLiaJsZQ8AEieFmLREETBARR9vMGAImSAw3a4kgYIKIONpmxhAwQWK4WUsEARNExNE2M4aACRLDzVoiCJggIo62mTEETJAYbtYSQcAEEXG0zYwhYILEcLOWCAImiIijbWYMARMkhpu1RBAwQUQcbTNjCJggMdysJYKACSLiaJsZQ8AEieFmLREETBARR9vMGAImSAw3a4kgYIKIONpmxhAwQWK4WUsEgf8BirDw2P5wajkAAAAASUVORK5CYII=");
        Sk.importMainWithBody("", false, code);
        TurtleGraphics.doneDelegates.push(function () {
            expect(cctx).toImageDiffEqual(refctx);
            done();
        });
    });
});