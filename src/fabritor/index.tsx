import { useEffect, useRef, useState } from 'react';
import { Layout, Spin } from 'antd';
import Header from './UI/header';
import Panel from './UI/panel';
import Toolbar from './UI/toolbar';
import Editor from '@/editor';
import { setGlobalEditor } from '@/utils/global';
import { GloablStateContext } from '@/context';
import ContextMenu from './components/ContextMenu';
import { SKETCH_ID } from '@/utils/constants';
import ToolTip from './components/ToolTip';

import '../font.css';


const { Content } = Layout;

const workspaceStyle: React.CSSProperties = {
  background: '#ddd',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  flex: 1
}

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
}

export default function Fabritor () {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const workspaceEl = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>();
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [isReady, setReady] = useState(false);
  const contextMenuRef = useRef<any>(null);
  const rotateAngleTipRef = useRef<any>(null);

  const clickHandler = (opt) => {
    const { target } = opt;
    if (!target) {
      contextMenuRef.current?.hide();
      return;
    }

    if (opt.button === 3) { // 右键
      if (target.id !== SKETCH_ID) {
        editorRef.current?.canvas.setActiveObject(target);
      }
      setTimeout(() => {
        contextMenuRef.current?.show();
      }, 50);
    } else {
      contextMenuRef.current?.hide();
    }
  }

  const selectionHandler = (opt) => {
    const { selected } = opt;
    if (selected && selected.length === 1) {
      setActiveObject(selected[0]);
    } else {
      // @ts-ignore
      setActiveObject(editorRef.current?.sketch);
    }
  }

  const rotateHandler = (opt) => {
    const { target, e } = opt;
    rotateAngleTipRef.current.show({
      left: e.pageX + 16,
      top: e.pageY
    }, `${Math.round(target.angle)}°`);
  }

  const mouseupHandler = () => {
    rotateAngleTipRef.current.close();
  }

  useEffect(() => {
    setTimeout(() => {
      const editor = new Editor({
        canvasEl: canvasEl.current,
        workspaceEl: workspaceEl.current,
        sketchEventHandler: {
          clickHandler,
          mouseupHandler,
          cloneHandler: (opt) => { setActiveObject(opt.target) },
          delHandler: () => { setActiveObject(null) },
          selectionHandler,
          rotateHandler
        }
      });
  
      editorRef.current = editor;
      setGlobalEditor(editor);
      setReady(true);
    }, 300);

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    }
  }, []);

  return (
    <GloablStateContext.Provider
      value={{
        object: activeObject,
        setActiveObject,
        isReady,
        setReady
      }}
    >
      <Layout style={{ height: '100%' }} className="fabritor-layout">
        <Spin spinning={!isReady} fullscreen />
        <ToolTip ref={rotateAngleTipRef} />
        <Header />
        <Layout>
          <Panel />
          <Content style={contentStyle}>
            <Toolbar />
            <ContextMenu ref={contextMenuRef}>
              <div style={workspaceStyle} ref={workspaceEl} className="fabritor-workspace">
                <canvas ref={canvasEl} />
              </div>
            </ContextMenu>
          </Content>
        </Layout>
      </Layout>
    </GloablStateContext.Provider>
  )
}