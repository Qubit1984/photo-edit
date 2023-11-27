import fabric from 'fabric';
import { FABRITOR_CUSTOM_PROPS } from '@/utils/constants';
import Editor from '.';
// https://github.com/alimozdemir/fabric-history/blob/master/src/index.js

export default class FabricHistory {
  private historyUndo: string[];
  private historyRedo: string[];
  private currentState: string;
  private historyProcessing: boolean;
  private canvas: fabric.Canvas;
  private editor: Editor;

  constructor (editor) {
    this.historyUndo = [];
    this.historyRedo = [];
    this.canvas = editor.canvas;
    this.editor = editor;
    this.historyProcessing = false;
    this.currentState = this._getJSON();
    this.init();
  }

  private _checkHistoryUndoLength () {
    if (this.historyUndo.length > 100) {
      this.historyUndo.shift();
    }
  }

  private _checkHistoryRedoLength () {
    if (this.historyRedo.length > 100) {
      this.historyRedo.shift();
    }
  }

  private _historySaveAction () {
    if (this.historyProcessing) return;
    const json = this.currentState;
    this.historyUndo.push(json);
    this._checkHistoryUndoLength();
    this.currentState = this._getJSON();
  }

  private _getJSON () {
    return JSON.stringify(this.canvas.toJSON(FABRITOR_CUSTOM_PROPS));
  }

  private _historyEvents () {
    return {
      'object:added': this._historySaveAction.bind(this),
      'object:removed': this._historySaveAction.bind(this),
      'object:modified': this._historySaveAction.bind(this),
      'object:skewing': this._historySaveAction.bind(this),
      'fabritor:object:modified': this._historySaveAction.bind(this),
    };
  }

  private init () {
    this.canvas.on(this._historyEvents());
  }

  public dispose () {
    this.canvas.off(this._historyEvents());
  }

  public async undo () {
    const _history = this.historyUndo.pop();
    if (_history) {
      this.historyProcessing = true;
      this.historyRedo.push(this.currentState);
      this._checkHistoryRedoLength();
      this.currentState = _history;
      await this.editor.loadFromJSON(_history);
      this.historyProcessing = false;
      this.canvas.fire('fabritor:history:undo');
    }
  }

  public async redo () {
    const _history = this.historyRedo.pop();
    if (_history) {
      this.historyProcessing = true;
      this.historyUndo.push(this.currentState);
      this._checkHistoryUndoLength();
      this.currentState = _history;
      await this.editor.loadFromJSON(_history);
      this.historyProcessing = false;
      this.canvas.fire('fabritor:history:redo');
    }
  }
}