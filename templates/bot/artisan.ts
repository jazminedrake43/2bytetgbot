#!/usr/bin/env node
import { BotArtisan } from '2bytetgbot';

const artisan = new BotArtisan(__dirname, {
  botName: '{{botName}}',
  sectionsPath: './sections'
});

artisan.run();