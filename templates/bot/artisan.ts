#!/usr/bin/env node
import { BotArtisan } from '@2byte/tgbot-framework';

const artisan = new BotArtisan(__dirname, {
  botName: '{{botName}}',
  sectionsPath: './sections'
});

artisan.run();