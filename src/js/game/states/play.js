const _ = require('lodash');
const properties = require('../properties');
const Bouncer = require('../objects/Bouncer');
const Shadow = require('../objects/Shadow');

const play = {};

function createWater(game, height) {
    const water = game.add.tileSprite(0, height - 128, game.world.width, 128, 'water');

    game.physics.arcade.enable([water]);
    // With the current texture (view angle),
    // the point of contact is somewhere in the middle
    water.body.setSize(water.width, water.height * 0.6, 0, water.height * 0.4);
    water.body.allowGravity = false;
    water.body.immovable = true;

    return water;
}

function createDisc(game) {
    const disc = game.add.sprite(32, game.world.height * 0.5, 'disc');
    const anim = disc.animations.add('rotate');
    anim.play(40, true);

    disc.anchor.setTo(0.5, 0.5);

    game.physics.arcade.enable([disc]);
    disc.body.collideWorldBounds = true;
    disc.body.velocity.x = 250;
    disc.body.gravity.y = 200;
    disc.body.bounce.y = 1; // Higher will be less punitive for the player
    disc.body.maxVelocity.y = 250;
    disc.body.maxVelocity.x = 750;

    return disc;
}

function createShadow(game) {
    return Shadow.create(game, {
        color: 0x11367a,
        ground: game.height - 64,
        max_height: game.height,
        size: 16,
    });
}

function createSky(game, height) {
    const sky = game.add.tileSprite(0, height - 172, game.world.width, 88, 'sky');
    sky.scale.setTo(2, 2);
    game.stage.backgroundColor = '#0098f8';
    return sky;
}

function makeSplash(game, disc) {
    // Ignore any weird/low speed
    if (disc.body.velocity.y > 0) {
        return;
    }

    // Create the splash sprite below the disc
    const splash = game.add.sprite(disc.body.position.x + 24, disc.bottom, 'splash', 5);
    splash.anchor.setTo(0.5, 1);

    // Adapt animation to disc velocity
    const lastFrame = _.clamp(1, _.floor(-disc.body.velocity.y / 25), 6);
    const frameOrder = _.range(0, lastFrame);
    splash.animations.add('up', frameOrder);
    splash.animations.add('down', _.reverse(frameOrder));

    // Animation up
    splash.animations.play(
        'up',
        20, // framerate
    ).onComplete.add(() => {
        // then down
        splash.animations.play(
            'down',
            20,
            false, // no loop
            true, // kill the sprite on complete
        );
    });
}

play.create = function create() {
    this.game.world.setBounds(0, 0, properties.size.x * 30, properties.size.y);
    this.game.stage.backgroundColor = '#eeeeee';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.water = createWater(this.game, this.game.height);
    this.sky = createSky(this.game, this.water.top);

    const shadow = createShadow(this.game); // NOTE Disc has to be created after shadow (or help find a way to play with the z-indexes ^.^)
    this.disc = createDisc(this.game);
    this.disc.shadow = shadow.attachTo(this.disc);

    this.game.camera.follow(this.disc, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

    this.bouncer = Bouncer.create({ actor: this.disc });
};

play.update = function update() {
    const { disc, water, game } = this;

    disc.shadow.update();

    if (disc.alive) {
        // Handle bounce
        const didCollide = game.physics.arcade.collide(disc, water);
        if (didCollide) {
            makeSplash(game, disc);
        }
        this.bouncer.update(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR), didCollide);

        // The disc was too slow and killed
        if (!disc.alive) {
            // Reset the game later
            setTimeout(() => {
                this.game.state.clearCurrentState();
                this.game.state.restart();
            }, 750);
        }
    }
};


play.render = function render() {
    // Empty
};

module.exports = play;
