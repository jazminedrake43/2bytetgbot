import { Telegraf2byteContext } from "./Telegraf2byteContext";
import { Section } from "./Section";

export class InlineKeyboard {
  private keyboard: any[][] = [];
  private footFixedButtons: any[][] = [];
  private appendIndexes: number[] = [];
  private prependIndexes: number[] = [];

  static init(ctx: Telegraf2byteContext, section: Section): InlineKeyboard {
    return new InlineKeyboard(ctx, section);
  }

  constructor(private ctx: Telegraf2byteContext, private section: Section) {}

  addFootFixedButtons(buttons: any[][] | any[] | any): InlineKeyboard {
    if (!Array.isArray(buttons)) {
      this.footFixedButtons.push([buttons]);
    } else if (Array.isArray(buttons[0])) {
      this.footFixedButtons.push(...buttons);
    } else {
      this.footFixedButtons.push(buttons);
    }
    return this;
  }

  append(...row: any[] | any[][] | any): InlineKeyboard {
    if (!Array.isArray(row)) {
      this.keyboard.push([row]);
      this.appendIndexes.push(this.keyboard.length - 1);
    } else if (Array.isArray(row[0])) {
      this.keyboard.push(...row);
      this.appendIndexes.push(...Array.from({ length: row.length }, (_, i) => this.keyboard.length - row.length + i));
    } else {
      this.keyboard.push(row);
      this.appendIndexes.push(this.keyboard.length - 1);
    }
    return this;
  }

  appendArray(rows: any[][]): InlineKeyboard {
    rows.forEach(row => this.append(row));
    return this;
  }

  prependArray(rows: any[][]): InlineKeyboard {
    rows.forEach(row => this.prepend(row));
    return this;
  }

  prepend(...row: any[]): InlineKeyboard {
    if (!Array.isArray(row)) {
      this.keyboard.unshift([row]);
      this.prependIndexes.push(0);
    } else if (Array.isArray(row[0])) {
      this.keyboard.unshift(...row);
      this.prependIndexes.push(...Array.from({ length: row.length }, (_, i) => i));
    } else {
      this.keyboard.unshift(row);
      this.prependIndexes.push(0);
    }
    return this;
  }

  valueOf(): any[][] {
    const keyboard = this.keyboard;

    if (this.section.route.getMethod() !== 'index') {
      keyboard.push(...this.footFixedButtons);
    }
    
    this.keyboard = [];
    return keyboard;
  }

  [Symbol.toPrimitive]() {
    return this.valueOf();
  }

  reset(): InlineKeyboard {
    const appendsPrepends = [...this.appendIndexes, ...this.prependIndexes].sort((a, b) => a - b);
    for (let i = appendsPrepends.length - 1; i >= 0; i--) {
      this.keyboard.splice(appendsPrepends[i], 1);
    }
    this.appendIndexes = [];
    this.prependIndexes = [];
    return this;
  }
}
