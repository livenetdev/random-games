import { Game } from './game/game.js';
import { Warning, Loader, Title, Intro } from './game/acts/front.js';
import { Act1 } from './game/acts/act1.js';
import { Act2 } from './game/acts/act2.js';
import { Act3 } from './game/acts/act3.js';
import { Ending } from './game/acts/endings.js';
import { Developing } from './game/acts/develop.js';
import { installDebug } from './debug/debug.js';
import { installAutopilot } from './debug/autopilot.js';

// State machine: Title -> Intro -> Act1 -> Act2 -> Act3 -> Ending
const game = new Game();
const needs = (act) => (d) => d.act <= act || d.act === 9;
game.Scenes = {
  Title, Intro, Warning, Loader, Ending,
  Act1,
  // acts that need stills the background developer may not have finished yet
  Act2: class { constructor(g) { return new Developing(g, needs(2), () => new Act2(g)); } },
  Act3: class { constructor(g) { return new Developing(g, needs(3), () => new Act3(g)); } },
};
game.Scenes.Ending = class { constructor(g, type) { return new Developing(g, needs(4), () => new Ending(g, type)); } };
game.resume = () => {
  const s = game.state;
  const map = { intro: () => new Intro(game), act1: () => new Act1(game), act2: () => new game.Scenes.Act2(game), act3: () => new game.Scenes.Act3(game) };
  game.goto((map[s.act] || (() => new Title(game)))());
};
window.__game = game;
if (game.debug) installDebug(game);
if (game.q.get('autopilot')) installAutopilot(game, game.q.get('autopilot'));
const skipWarn = game.q.get('skipwarn') === '1';
game.goto(skipWarn ? new Loader(game) : new Warning(game));
game.start();
