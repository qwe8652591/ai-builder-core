/**
 * 实体关系图谱组件
 * 
 * 使用 Mermaid.js 渲染实体关系 ER 图
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Empty, Spin, Tooltip, Segmented, message, Tabs } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CopyOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { EntityMetadata } from './types';

// ==================== 类型定义 ====================

export interface EntityRelation {
  name: string;
  source: string;
  target: string;
  fieldName: string;
  relationType: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany' | 'Embedded';
  isArray?: boolean;
  isRequired?: boolean;
  __type: 'entityRelation';
}

interface ERDiagramProps {
  /** 实体关系数据 */
  relations: EntityRelation[];
  /** 实体列表（用于显示字段详情） */
  entities?: EntityMetadata[];
  /** 点击实体节点时的回调 */
  onEntityClick?: (entityName: string) => void;
  /** 显示模式：entity=实体关系图，table=数据库表关系图 */
  mode?: 'entity' | 'table';
}

// ==================== 颜色配置 ====================

const colors = {
  primary: '#cc0000',
  bg: '#f5f5f5',
  bgWhite: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  textSecondary: '#666666',
};

// ==================== 辅助函数 ====================

/**
 * 驼峰转下划线
 */
function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

/**
 * 生成 Mermaid ER 图语法
 * @param mode 'entity' 显示实体名，'table' 显示表名
 */
function generateMermaidERD(
  relations: EntityRelation[], 
  entities?: EntityMetadata[],
  mode: 'entity' | 'table' = 'entity'
): string {
  const lines = ['erDiagram'];
  const entitySet = new Set<string>();
  
  // 表模式：构建实体名到表名的映射
  const entityToTable = new Map<string, string>();
  if (mode === 'table' && entities) {
    for (const entity of entities) {
      if (entity.table) {
        entityToTable.set(entity.name, entity.table);
      }
    }
  }
  
  // 获取显示名称（表模式用表名，实体模式用实体名）
  const getDisplayName = (entityName: string): string => {
    if (mode === 'table') {
      return entityToTable.get(entityName) || toSnakeCase(entityName);
    }
    return entityName;
  };
  
  // 收集所有涉及的实体
  for (const relation of relations) {
    entitySet.add(relation.source);
    entitySet.add(relation.target);
  }
  
  // 表模式下：添加所有有表名的实体（确保显示完整）
  if (mode === 'table' && entities) {
    for (const entity of entities) {
      if (entity.table) {
        entitySet.add(entity.name);
      }
    }
  }
  
  // 收集每个实体的关系字段信息
  const entityRelationFields = new Map<string, Map<string, { target: string; type: string }>>();
  const entityReferencedBy = new Map<string, Array<{ source: string; fieldName: string; type: string }>>();
  
  for (const relation of relations) {
    if (!entityRelationFields.has(relation.source)) {
      entityRelationFields.set(relation.source, new Map());
    }
    entityRelationFields.get(relation.source)!.set(relation.fieldName, {
      target: relation.target,
      type: relation.relationType,
    });
    
    if (!entityReferencedBy.has(relation.target)) {
      entityReferencedBy.set(relation.target, []);
    }
    entityReferencedBy.get(relation.target)!.push({
      source: relation.source,
      fieldName: relation.fieldName,
      type: relation.relationType,
    });
  }
  
  // 获取关系类型的简短标记
  const getRelationMark = (type: string): string => {
    const t = type.toLowerCase();
    if (t === 'embedded') return 'EMB';
    if (t === 'onetoone') return 'O2O';
    if (t === 'onetomany') return 'O2M';
    if (t === 'manytoone') return 'M2O';
    if (t === 'manytomany') return 'M2M';
    return 'REL';
  };
  
  // 转换为数据库类型
  const getDbType = (type: string): string => {
    const t = (type || 'string').toLowerCase();
    if (t === 'string') return 'varchar';
    if (t === 'number') return 'decimal';
    if (t === 'boolean') return 'bool';
    if (t === 'datetime' || t === 'date') return 'datetime';
    return t.replace(/[^a-zA-Z0-9]/g, '') || 'varchar';
  };
  
  // 查找嵌入对象的字段定义
  const getEmbeddedFields = (targetName: string): Record<string, any> => {
    if (!entities) return {};
    const targetEntity = entities.find(e => 
      e.name === targetName || e.name.toLowerCase() === targetName.toLowerCase()
    );
    return targetEntity?.fields || {};
  };
  
  if (entities) {
    for (const entity of entities) {
      if (entitySet.has(entity.name)) {
        // 表模式下跳过没有表名的实体
        if (mode === 'table' && !entity.table) continue;
        
        const displayName = getDisplayName(entity.name);
        lines.push(`    ${displayName} {`);
        const fields = Object.entries(entity.fields || {});
        const relationFields = entityRelationFields.get(entity.name) || new Map();
        const referencedBy = entityReferencedBy.get(entity.name) || [];
        
        if (mode === 'table') {
          // ========== 表模式：只显示主键和关系字段 ==========
          
          // 1. 显示主键
          for (const [fieldName, field] of fields) {
            if (field.primaryKey) {
              const colName = toSnakeCase(fieldName);
              const dbType = getDbType(field.type);
              lines.push(`        ${dbType} ${colName} PK`);
            }
          }
          
          // 2. 嵌入对象：显示为 json 类型的列（平铺的标记）
          for (const [fieldName, relInfo] of relationFields) {
            if (relInfo.type.toLowerCase() === 'embedded') {
              const prefix = toSnakeCase(fieldName);
              // Mermaid 只支持 PK/FK，用普通列表示嵌入
              lines.push(`        json ${prefix}`);
            }
          }
          
          // 3. 添加外键列（ManyToOne/OneToOne）
          for (const [fieldName, relInfo] of relationFields) {
            const rt = relInfo.type.toLowerCase();
            if (rt === 'manytoone' || rt === 'onetoone') {
              const fkName = `${toSnakeCase(fieldName)}_id`;
              lines.push(`        bigint ${fkName} FK`);
            }
          }
          
          // 4. 被 OneToMany 引用时添加外键列
          for (const ref of referencedBy) {
            if (ref.type.toLowerCase() === 'onetomany') {
              const parentTable = getDisplayName(ref.source);
              const fkName = `${parentTable}_id`;
              lines.push(`        bigint ${fkName} FK`);
            }
          }
          
        } else {
          // ========== 实体模式：只显示主键和关系字段 ==========
          for (const [fieldName, field] of fields) {
            if (field.primaryKey) {
              const typeStr = String(field.type || 'unknown').replace(/[^a-zA-Z0-9]/g, '') || 'string';
              lines.push(`        ${typeStr} ${fieldName} PK`);
            }
          }
          
          for (const [fieldName, relInfo] of relationFields) {
            const mark = getRelationMark(relInfo.type);
            lines.push(`        ${mark} ${fieldName} FK`);
          }
          
          for (const ref of referencedBy) {
            const mark = getRelationMark(ref.type);
            lines.push(`        ${mark} from_${getDisplayName(ref.source)}`);
          }
        }
        
        lines.push(`    }`);
      }
    }
  }
  
  // 添加关系线（表模式下跳过嵌入关系，因为已平铺）
  for (const relation of relations) {
    const relType = relation.relationType?.toLowerCase() || '';
    
    // 表模式下跳过嵌入关系
    if (mode === 'table' && relType === 'embedded') continue;
    
    let connector: string;
    let typeLabel: string;
    
    switch (relType) {
      case 'onetoone':
        connector = '||--||';
        typeLabel = '1:1';
        break;
      case 'onetomany':
        connector = '||--o{';
        typeLabel = '1:N';
        break;
      case 'manytoone':
        connector = '}o--||';
        typeLabel = 'N:1';
        break;
      case 'manytomany':
        connector = '}o--o{';
        typeLabel = 'N:N';
        break;
      case 'embedded':
        connector = '||..||';
        typeLabel = '嵌入';
        break;
      default:
        connector = '||--||';
        typeLabel = '';
    }
    
    // 表模式下显示外键列名（下划线格式）
    const fieldLabel = mode === 'table' 
      ? `${toSnakeCase(relation.fieldName)}_id` 
      : relation.fieldName;
    const label = typeLabel ? `${fieldLabel} [${typeLabel}]` : fieldLabel;
    
    const sourceName = getDisplayName(relation.source);
    const targetName = getDisplayName(relation.target);
    lines.push(`    ${sourceName} ${connector} ${targetName} : "${label}"`);
  }
  
  return lines.join('\n');
}

/**
 * 生成关系类型说明
 */
function getRelationLabel(type: EntityRelation['relationType']): string {
  switch (type) {
    case 'OneToOne': return '一对一';
    case 'OneToMany': return '一对多';
    case 'ManyToOne': return '多对一';
    case 'ManyToMany': return '多对多';
    case 'Embedded': return '嵌入';
    default: return type;
  }
}

// ==================== 主组件 ====================

// 生成唯一 ID
let diagramIdCounter = 0;
function generateDiagramId() {
  return `er-diagram-${Date.now()}-${++diagramIdCounter}`;
}

export function ERDiagram({ relations, entities, onEntityClick, mode = 'entity' }: ERDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [mermaidCode, setMermaidCode] = useState('');
  const [viewMode, setViewMode] = useState<'diagram' | 'code' | 'list'>('diagram');
  
  // 标题
  const title = mode === 'table' ? '数据库表关系图' : '实体关系图谱';
  
  // 渲染 Mermaid 图表
  const renderDiagram = async () => {
    console.log('[ERDiagram] 开始渲染, relations:', relations.length);
    
    if (relations.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 动态导入 mermaid（避免 SSR 问题）
      const mermaid = (await import('mermaid')).default;
      console.log('[ERDiagram] Mermaid 已加载');
      
      // 初始化 mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        er: {
          layoutDirection: 'TB',
          minEntityWidth: 100,
          minEntityHeight: 75,
          entityPadding: 15,
          useMaxWidth: false,
        },
      });
      
      // 生成图表代码
      const code = generateMermaidERD(relations, entities, mode);
      console.log('[ERDiagram] 生成的 Mermaid 代码:\n', code);
      setMermaidCode(code);
      
      // 使用唯一 ID 渲染图表
      const diagramId = generateDiagramId();
      console.log('[ERDiagram] 渲染 ID:', diagramId);
      
      const { svg } = await mermaid.render(diagramId, code);
      console.log('[ERDiagram] SVG 生成成功, 长度:', svg.length);
      
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        
        // 添加点击事件
        if (onEntityClick) {
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.querySelectorAll('.er.entityBox, .er.entityLabel').forEach((node) => {
              const textEl = node.closest('g')?.querySelector('text');
              const entityName = textEl?.textContent?.trim();
              if (entityName) {
                (node as HTMLElement).style.cursor = 'pointer';
                node.addEventListener('click', () => onEntityClick(entityName));
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('[ERDiagram] 渲染失败:', e);
      const errMsg = (e as Error).message || String(e);
      setError(`图表渲染失败: ${errMsg}`);
      // 如果 Mermaid 渲染失败，显示代码视图作为降级
      setViewMode('code');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (viewMode === 'diagram') {
      renderDiagram();
    } else {
      setMermaidCode(generateMermaidERD(relations, entities, mode));
      setLoading(false);
    }
  }, [relations, entities, viewMode, mode]);
  
  // 复制代码
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      message.success('已复制 Mermaid 代码');
    } catch {
      message.error('复制失败');
    }
  };
  
  // 导出 SVG
  const handleExportSVG = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entity-relations.svg';
    a.click();
    URL.revokeObjectURL(url);
    message.success('已导出 SVG');
  };
  
  // 空状态
  if (relations.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Empty description="暂无实体关系数据" />
        <div style={{ marginTop: 16, color: colors.textSecondary, fontSize: 13 }}>
          实体关系会在加载带有关联字段的实体后自动生成
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 工具栏 */}
      <div style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: colors.bgWhite,
      }}>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as 'diagram' | 'code' | 'list')}
          options={[
            { label: '📊 图表', value: 'diagram' },
            { label: '📝 代码', value: 'code' },
            { label: '📋 列表', value: 'list' },
          ]}
          size="small"
        />
        
        <div style={{ display: 'flex', gap: 4 }}>
          {viewMode === 'diagram' && (
            <>
              <Tooltip title="缩小">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={() => setScale(Math.max(0.3, scale - 0.1))}
                />
              </Tooltip>
              <span style={{ 
                fontSize: 12, 
                color: colors.textSecondary,
                minWidth: 40,
                textAlign: 'center',
              }}>
                {Math.round(scale * 100)}%
              </span>
              <Tooltip title="放大">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={() => setScale(Math.min(2, scale + 0.1))}
                />
              </Tooltip>
              <Tooltip title="重置">
                <Button
                  type="text"
                  size="small"
                  icon={<FullscreenOutlined />}
                  onClick={() => setScale(1)}
                />
              </Tooltip>
              <Tooltip title="刷新">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={renderDiagram}
                />
              </Tooltip>
              <Tooltip title="导出 SVG">
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleExportSVG}
                />
              </Tooltip>
            </>
          )}
          {viewMode === 'code' && (
            <Tooltip title="复制代码">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopy}
              />
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', background: colors.bg, padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin>
              <div style={{ padding: 20, color: colors.textSecondary }}>正在渲染关系图...</div>
            </Spin>
          </div>
        ) : error ? (
          <div style={{ color: '#f14c4c', padding: 20 }}>{error}</div>
        ) : viewMode === 'diagram' ? (
          <div
            ref={containerRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              minHeight: 400,
              background: colors.bgWhite,
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
        ) : viewMode === 'code' ? (
          <pre style={{
            background: colors.bgWhite,
            borderRadius: 8,
            padding: 16,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, monospace",
            lineHeight: 1.6,
            margin: 0,
            overflow: 'auto',
          }}>
            {mermaidCode}
          </pre>
        ) : (
          /* 列表视图 */
          <div style={{ 
            background: colors.bgWhite, 
            borderRadius: 8, 
            padding: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 16, color: colors.text }}>
              实体关系列表 ({relations.length} 个)
            </div>
            {relations.map((rel, index) => (
              <div 
                key={rel.name || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: colors.bg,
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              >
                <div style={{ 
                  width: 100, 
                  fontWeight: 500,
                  color: colors.primary,
                  cursor: onEntityClick ? 'pointer' : 'default',
                }}
                  onClick={() => onEntityClick?.(rel.source)}
                >
                  {rel.source}
                </div>
                
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>
                    {rel.relationType === 'OneToOne' && '↔️'}
                    {rel.relationType === 'OneToMany' && '→📦'}
                    {rel.relationType === 'ManyToOne' && '📦→'}
                    {rel.relationType === 'ManyToMany' && '📦↔📦'}
                    {rel.relationType === 'Embedded' && '📎'}
                  </span>
                  <span style={{ 
                    fontSize: 12, 
                    color: colors.textSecondary,
                    background: colors.bgWhite,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {rel.fieldName} ({getRelationLabel(rel.relationType)})
                  </span>
                </div>
                
                <div style={{ 
                  width: 100, 
                  textAlign: 'right',
                  fontWeight: 500,
                  color: '#1890ff',
                  cursor: onEntityClick ? 'pointer' : 'default',
                }}
                  onClick={() => onEntityClick?.(rel.target)}
                >
                  {rel.target}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 统计信息 */}
      <div style={{
        padding: '8px 16px',
        borderTop: `1px solid ${colors.border}`,
        fontSize: 12,
        color: colors.textSecondary,
        background: colors.bgWhite,
        display: 'flex',
        gap: 16,
      }}>
        <span>共 {relations.length} 个关系</span>
        <span>涉及 {new Set(relations.flatMap(r => [r.source, r.target])).size} 个实体</span>
      </div>
    </div>
  );
}

export default ERDiagram;
