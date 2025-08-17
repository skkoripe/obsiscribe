// Mock implementation of Obsidian API for testing

// Mock Plugin class
class Plugin {
  constructor() {
    this.app = {
      workspace: {
        getActiveViewOfType: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      },
      vault: {
        getConfig: jest.fn(),
        setConfig: jest.fn()
      }
    };
  }

  addRibbonIcon = jest.fn().mockReturnValue({
    addClass: jest.fn(),
    removeClass: jest.fn(),
    setAttribute: jest.fn()
  });

  addStatusBarItem = jest.fn().mockReturnValue({
    setText: jest.fn(),
    addClass: jest.fn(),
    removeClass: jest.fn(),
    style: {}
  });

  addSettingTab = jest.fn();
  registerEvent = jest.fn();
  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
}

// Mock Editor class
class Editor {
  constructor() {}
  
  getCursor = jest.fn();
  setCursor = jest.fn();
  replaceRange = jest.fn();
  getLine = jest.fn();
  lastLine = jest.fn();
  lineCount = jest.fn();
  getDoc = jest.fn();
  refresh = jest.fn();
  getValue = jest.fn();
  setValue = jest.fn();
}

// Mock MarkdownView class
class MarkdownView {
  constructor() {
    this.editor = new Editor();
    this.file = {
      name: 'test-note.md',
      path: 'test-note.md'
    };
  }
}

// Mock Notice class
class Notice {
  constructor(message, duration) {
    this.message = message;
    this.duration = duration;
  }
  
  setMessage = jest.fn();
  hide = jest.fn();
}

// Mock PluginSettingTab class
class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      empty: jest.fn(),
      createEl: jest.fn().mockReturnValue({
        setText: jest.fn()
      }),
      appendChild: jest.fn()
    };
  }
  
  display = jest.fn();
  hide = jest.fn();
}

// Mock Setting class
class Setting {
  constructor(containerEl) {
    this.containerEl = containerEl;
  }
  
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addText = jest.fn().mockImplementation(callback => {
    callback({
      setValue: jest.fn().mockReturnThis(),
      setPlaceholder: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis()
    });
    return this;
  });
  addToggle = jest.fn().mockImplementation(callback => {
    callback({
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis()
    });
    return this;
  });
  addDropdown = jest.fn().mockImplementation(callback => {
    callback({
      addOption: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis()
    });
    return this;
  });
  addButton = jest.fn().mockImplementation(callback => {
    callback({
      setButtonText: jest.fn().mockReturnThis(),
      setWarning: jest.fn().mockReturnThis(),
      onClick: jest.fn().mockReturnThis()
    });
    return this;
  });
}

// Mock App class
class App {
  constructor() {
    this.workspace = {
      getActiveViewOfType: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
    this.vault = {
      getConfig: jest.fn(),
      setConfig: jest.fn()
    };
  }
}

module.exports = {
  Plugin,
  Editor,
  MarkdownView,
  Notice,
  PluginSettingTab,
  Setting,
  App
};
