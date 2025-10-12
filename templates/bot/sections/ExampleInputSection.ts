import { RunSectionRoute, Section } from "@2byte/tgbot-framework";
import { SectionOptions } from "@2byte/tgbot-framework";
import { InlineKeyboard } from "@2byte/tgbot-framework";

export default class ExampleInputSection extends Section {
  static command = "exampleInput";
  static description = "ExampleInput section";
  static actionRoutes = {
    "exampleInput.index": "index",
    "exampleInput.input": "input",
    "exampleInput.inputAwaiting": "inputAwaiting",
  };

  public sectionId = "exampleInput";
  private mainInlineKeyboard: InlineKeyboard;

  constructor(options: SectionOptions) {
    super(options);

    this.mainInlineKeyboard = this.makeInlineKeyboard().addFootFixedButtons(this.btnHome);
  }

  public async up(): Promise<void> {}
  public async down(): Promise<void> {}
  public async setup(): Promise<void> {}
  public async unsetup(): Promise<void> {}

  async index() {
    const message = `
      👋 Welcome to Exampleinput Section
    `;

    await this.message(message)
      .inlineKeyboard(
        this.mainInlineKeyboard.append(
          this.makeInlineButton('➕ Example input', 'exampleInput.input')
        ).append(
          this.makeInlineButton('➕ Example input with awaiting', 'exampleInput.inputAwaiting')
        ).append(
          this.btnHome
        )
      )
      .send();
  }

  async input() {
    await this.message("Please enter some text:")
      .inlineKeyboard(this.mainInlineKeyboard)
      .requestInput("userText", {
        runSection: new RunSectionRoute().section("exampleInput").method("exampleInputHandler"),
      }).send();
  }

  async exampleInputHandler() {
    const userText = this.getAnswerInput("userText");
    
    await this.message(`You entered: ${userText}`)
      .inlineKeyboard(this.mainInlineKeyboard.append(
        this.makeInlineButton('➕ Example input', 'exampleInput.input')
      ))
      .send();
  }

  async inputAwaiting() {
    try {
      const userText = await this.message("Please enter some text (with awaiting):")
        .inlineKeyboard(this.mainInlineKeyboard)
        .requestInputWithAwait("userTextAwaiting", {
          allowCancel: true,
          cancelButtonText: "Cancel",
        });

      await this.message(`You entered (awaiting): ${userText}`)
        .inlineKeyboard(this.mainInlineKeyboard.append(
          this.makeInlineButton('➕ Example input with awaiting', 'exampleInput.inputAwaiting')
        ))
        .send();
    } catch (error) {
      await this.message("Input was cancelled.")
        .inlineKeyboard(this.mainInlineKeyboard)
        .send();
    }
  }

}
