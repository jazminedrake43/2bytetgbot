import { Telegraf2byteContext } from "./Telegraf2byteContext";
import { Section } from "./Section";

export class InlineKeyboard {
  private keyboard: any[][] = [];
  private footFixedButtons: any[][] = [];

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

  append(row: any[] | any[][]): InlineKeyboard {
    if (!Array.isArray(row)) {
      this.keyboard.push([row]);
    } else if (Array.isArray(row[0])) {
      this.keyboard.push(...row);
    } else {
      this.keyboard.push(row);
    }
    return this;
  }

  prepend(row: any[]): InlineKeyboard {
    if (!Array.isArray(row)) {
      this.keyboard.unshift([row]);
    } else if (Array.isArray(row[0])) {
      this.keyboard.unshift(...row);
    } else {
      this.keyboard.unshift(row);
    }
    return this;
  }

  valueOf(): any[][] {
    const keyboard = this.keyboard;

    if (this.section.route.getMethod() !== 'index') {
      keyboard.push(...this.footFixedButtons);
    }
    
    return keyboard;
  }

  [Symbol.toPrimitive]() {
    return this.valueOf();
  }
}
