import { App, Editor, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface FlomoSettings {
  webhookUrl: string;
  defaultTags: string;
}

const DEFAULT_SETTINGS: FlomoSettings = {
  webhookUrl: '',
  defaultTags: ''
};

export default class FlomoPlugin extends Plugin {
  settings!: FlomoSettings;

  async onload() {
    await this.loadSettings();

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
        const selection = editor.getSelection();
        if (selection) {
          menu.addItem((item) => {
            item.setTitle('发送到 Flomo')
              .setIcon('send')
              .onClick(() => new FlomoModal(this.app, this, selection).open());
          });
        }
        menu.addItem((item) => {
          item.setTitle('打开 Flomo')
            .setIcon('edit')
            .onClick(() => new FlomoModal(this.app, this).open());
        });
      })
    );

    this.addSettingTab(new FlomoSettingTab(this.app, this));
  }

  async sendToFlomo(content: string, tags?: string) {
    if (!this.settings.webhookUrl) {
      new Notice('请先配置 Flomo Webhook URL');
      return;
    }

    let finalContent = content;
    const allTags = [tags, this.settings.defaultTags].filter(t => t).join(',');
    if (allTags) {
      const tagList = allTags.split(',').map(t => {
        const trimmed = t.trim();
        return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      }).join(' ');
      finalContent = `${content}\n\n${tagList}`;
    }

    try {
      const response = await fetch(this.settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalContent })
      });
      if (response.ok) {
        new Notice('已发送到 Flomo');
      } else {
        new Notice('发送失败');
      }
    } catch (error) {
      new Notice('发送失败: ' + (error as Error).message);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class FlomoModal extends Modal {
  plugin: FlomoPlugin;
  contentEl!: HTMLTextAreaElement;
  tagsEl!: HTMLInputElement;
  initialContent?: string;

  constructor(app: App, plugin: FlomoPlugin, initialContent?: string) {
    super(app);
    this.plugin = plugin;
    this.initialContent = initialContent;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '发送到 Flomo' });

    contentEl.createEl('label', { text: '内容' });
    this.contentEl = contentEl.createEl('textarea', { attr: { rows: '6', style: 'width: 100%; margin-bottom: 10px;' } });
    if (this.initialContent) {
      this.contentEl.value = this.initialContent;
    }

    contentEl.createEl('label', { text: '标签 (可选，逗号分隔)' });
    this.tagsEl = contentEl.createEl('input', { type: 'text', attr: { style: 'width: 100%; margin-bottom: 10px;' } });

    const btn = contentEl.createEl('button', { text: '发送' });
    btn.onclick = () => {
      this.plugin.sendToFlomo(this.contentEl.value, this.tagsEl.value);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class FlomoSettingTab extends PluginSettingTab {
  plugin: FlomoPlugin;

  constructor(app: App, plugin: FlomoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Webhook URL')
      .setDesc('Flomo webhook URL')
      .addText(text => text
        .setPlaceholder('https://flomoapp.com/iwh/xxxxx')
        .setValue(this.plugin.settings.webhookUrl)
        .onChange(async (value) => {
          this.plugin.settings.webhookUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('默认标签')
      .setDesc('默认添加的标签，逗号分隔')
      .addText(text => text
        .setPlaceholder('Obsidian,笔记')
        .setValue(this.plugin.settings.defaultTags)
        .onChange(async (value) => {
          this.plugin.settings.defaultTags = value;
          await this.plugin.saveSettings();
        }));
  }
}
