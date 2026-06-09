import { useState } from 'react';
import type { DeviceTreeNode } from '../types.js';

interface Props {
  tree: DeviceTreeNode[];
  selectedId: string | null;
  loadingNodeId: string | null;
  onExpand: (node: DeviceTreeNode) => Promise<void>;
  onSelect: (node: DeviceTreeNode) => void;
}

function statusText(node: DeviceTreeNode): string {
  if (!node.camera) return '目录';
  if (node.channelStatus === 1) return '在线';
  if (node.channelStatus === 0) return '离线';
  return '设备';
}

function TreeNode({
  node,
  depth,
  expanded,
  selectedId,
  loadingNodeId,
  onToggle,
  isExpanded,
  onExpand,
  onSelect
}: {
  node: DeviceTreeNode;
  depth: number;
  expanded: boolean;
  selectedId: string | null;
  loadingNodeId: string | null;
  onToggle: (nodeId: string) => void;
  isExpanded: (nodeId: string) => boolean;
  onExpand: (node: DeviceTreeNode) => Promise<void>;
  onSelect: (node: DeviceTreeNode) => void;
}) {
  const isSelected = Boolean(node.camera && node.camera.id === selectedId);
  const isLoading = loadingNodeId === node.id || node.loading;

  const handleClick = async () => {
    if (node.camera) {
      onSelect(node);
      return;
    }
    onToggle(node.id);
    if (!node.loaded && !isLoading) await onExpand(node);
  };

  return (
    <div className="tree-row-wrap">
      <button
        className={[
          'tree-row',
          node.camera ? 'tree-row-device' : 'tree-row-folder',
          isSelected ? 'active' : '',
          isLoading ? 'loading' : ''
        ].join(' ')}
        style={{ paddingLeft: 10 + depth * 18 }}
        type="button"
        onClick={handleClick}
        title={node.name}
      >
        <span className="tree-toggle">{node.camera ? '' : expanded ? '-' : '+'}</span>
        <span className="tree-name">{node.name}</span>
        <span className="tree-meta">{isLoading ? '加载中' : statusText(node)}</span>
      </button>
      {expanded && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={isExpanded(child.id)}
              selectedId={selectedId}
              loadingNodeId={loadingNodeId}
              onToggle={onToggle}
              isExpanded={isExpanded}
              onExpand={onExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DevicePanel({ tree = [], selectedId, loadingNodeId, onExpand, onSelect }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (nodeId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const isExpanded = (nodeId: string) => expandedIds.has(nodeId);

  return (
    <section className="panel device-panel">
      <div className="panel-title">设备树</div>
      {tree.length === 0 ? (
        <p className="muted">尚未读取到真实设备树，请登录后刷新设备。</p>
      ) : (
        <div className="device-tree">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expanded={isExpanded(node.id)}
              selectedId={selectedId}
              loadingNodeId={loadingNodeId}
              onToggle={toggle}
              isExpanded={isExpanded}
              onExpand={onExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
