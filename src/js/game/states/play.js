const _ = require('lodash');
const properties = require('../properties');

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
    const disc = game.add.sprite(32, game.world.height * 0.7, 'disc');
    const anim = disc.animations.add('rotate');
    anim.play(40, true);

    disc.anchor.setTo(0.5, 0.5);

    game.physics.arcade.enable([disc]);
    disc.body.bounce.y = 0.95;
    disc.body.collideWorldBounds = true;

    return disc;
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
    const splash = game.add.sprite(disc.centerX, disc.bottom, 'splash', 5);
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

function updateCapture({ total, pressed, release }, gap, isPressed) {
    if (gap > 50) {
        return { total, pressed, release: !isPressed };
    } else if (!release) {
        return { total: total + 1, pressed, release: !isPressed };
    }

    return { total: total + 1, pressed: pressed + (isPressed ? 1 : 0), release: true };
}

function resetCapture({ release }) {
    return { total: 1, pressed: 1, release };
}

play.create = function create() {
    this.game.world.setBounds(0, 0, properties.size.x * 30, properties.size.y);
    this.game.stage.backgroundColor = '#eeeeee';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);


    this.water = createWater(this.game, this.game.height);
    this.sky = createSky(this.game, this.water.top);
    this.disc = createDisc(this.game);

    this.disc.body.velocity.x = 250;
    this.disc.body.gravity.y = 200;
    this.disc.body.bounce.y = 1.2; // Higher will be less punitive for the player
    this.disc.falling = true;

    this.game.camera.follow(this.disc, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

    this.capture = resetCapture({ release: true });
};

play.update = function update() {
    const { disc, water, game } = this;
    game.physics.arcade.collide(disc, water, () => {
        makeSplash(game, disc);
    });

    const gap = Math.max(0, water.body.position.y - disc.body.position.y);
    const isPressed = game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
    this.capture = updateCapture(this.capture, gap, isPressed);

    if (this.disc.falling && disc.body.velocity.y < 0) { // That's the bounce
        const ratioPressure = this.capture.pressed / this.capture.total;
        this.disc.falling = false;
        this.capture = resetCapture(this.capture);
        this.disc.body.velocity.y *= ratioPressure;
    } else if (!this.disc.falling && disc.body.velocity.y >= 0) {
        this.disc.falling = true;
    }
};

play.render = function render() {
    // const { disc, water, game } = this;
    // game.debug.body(disc);
    // game.debug.bodyInfo(disc, 32, 72);
    // game.debug.body(water);
};

module.exports = play;
