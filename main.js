"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FlomoPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  webhookUrl: "",
  defaultTags: ""
};
var FlomoPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const selection = editor.getSelection();
        if (selection) {
          menu.addItem((item) => {
            item.setTitle("\u53D1\u9001\u5230 Flomo").setIcon("send").onClick(() => new FlomoModal(this.app, this, selection).open());
          });
        }
        menu.addItem((item) => {
          item.setTitle("\u6253\u5F00 Flomo").setIcon("edit").onClick(() => new FlomoModal(this.app, this).open());
        });
      })
    );
    this.addSettingTab(new FlomoSettingTab(this.app, this));
  }
  async sendToFlomo(content, tags) {
    if (!this.settings.webhookUrl) {
      new import_obsidian.Notice("\u8BF7\u5148\u914D\u7F6E Flomo Webhook URL");
      return;
    }
    let finalContent = content;
    const allTags = [tags, this.settings.defaultTags].filter((t) => t).join(",");
    if (allTags) {
      const tagList = allTags.split(",").map((t) => {
        const trimmed = t.trim();
        return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      }).join(" ");
      finalContent = `${content}

${tagList}`;
    }
    try {
      const response = await fetch(this.settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: finalContent })
      });
      if (response.ok) {
        new import_obsidian.Notice("\u5DF2\u53D1\u9001\u5230 Flomo");
      } else {
        new import_obsidian.Notice("\u53D1\u9001\u5931\u8D25");
      }
    } catch (error) {
      new import_obsidian.Notice("\u53D1\u9001\u5931\u8D25: " + error.message);
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var FlomoModal = class extends import_obsidian.Modal {
  constructor(app, plugin, initialContent) {
    super(app);
    this.plugin = plugin;
    this.initialContent = initialContent;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "\u53D1\u9001\u5230 Flomo" });
    contentEl.createEl("label", { text: "\u5185\u5BB9" });
    this.contentEl = contentEl.createEl("textarea", { attr: { rows: "6", style: "width: 100%; margin-bottom: 10px;" } });
    if (this.initialContent) {
      this.contentEl.value = this.initialContent;
    }
    contentEl.createEl("label", { text: "\u6807\u7B7E (\u53EF\u9009\uFF0C\u9017\u53F7\u5206\u9694)" });
    this.tagsEl = contentEl.createEl("input", { type: "text", attr: { style: "width: 100%; margin-bottom: 10px;" } });
    const btn = contentEl.createEl("button", { text: "\u53D1\u9001" });
    btn.onclick = () => {
      this.plugin.sendToFlomo(this.contentEl.value, this.tagsEl.value);
      this.close();
    };
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var FlomoSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Webhook URL").setDesc("Flomo webhook URL").addText((text) => text.setPlaceholder("https://flomoapp.com/iwh/xxxxx").setValue(this.plugin.settings.webhookUrl).onChange(async (value) => {
      this.plugin.settings.webhookUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6807\u7B7E").setDesc("\u9ED8\u8BA4\u6DFB\u52A0\u7684\u6807\u7B7E\uFF0C\u9017\u53F7\u5206\u9694").addText((text) => text.setPlaceholder("Obsidian,\u7B14\u8BB0").setValue(this.plugin.settings.defaultTags).onChange(async (value) => {
      this.plugin.settings.defaultTags = value;
      await this.plugin.saveSettings();
    }));
  }
};
