import { Fragment, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import type { KeyResult, Objective } from '../../types';
import styles from './OkrReference.module.css';

type ReferenceKind = 'o' | 'kr';

export interface OkrReferenceEditorHandle {
  insertReference: (kind: ReferenceKind, id: number) => void;
}

interface OkrReferenceEditorProps {
  value: string;
  objectives: Objective[];
  placeholder: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  id?: string;
  onChange: (value: string) => void;
}

interface ReferencePart {
  kind: ReferenceKind;
  id: number;
}

const tokenPattern = /\[\[okr:(o|kr):(\d+)\]\]/g;

export function okrReferenceToken(kind: ReferenceKind, id: number) {
  return `[[okr:${kind}:${id}]]`;
}

function findReference(kind: ReferenceKind, id: number, objectives: Objective[]) {
  if (kind === 'o') {
    const objective = objectives.find(item => item.id === id);
    return objective ? { kind, id, objective, keyResult: null } : null;
  }
  for (const objective of objectives) {
    const keyResult = objective.key_results.find(item => item.id === id);
    if (keyResult) return { kind, id, objective, keyResult };
  }
  return null;
}

function resolveLegacyReference(kind: ReferenceKind, content: string, objectives: Objective[]): ReferencePart | null {
  if (kind === 'o') {
    const objective = objectives.find(item => content === `【O】${item.title}`);
    return objective ? { kind, id: objective.id } : null;
  }

  for (const objective of objectives) {
    const prefix = `【KR】${objective.title} / `;
    if (!content.startsWith(prefix)) continue;
    const title = content.slice(prefix.length);
    const keyResult = objective.key_results.find(item => item.title === title);
    if (keyResult) return { kind, id: keyResult.id };
  }
  return null;
}

function normalizeLegacyReferences(value: string, objectives: Objective[]) {
  let cursor = 0;
  let output = '';
  while (cursor < value.length) {
    const objectiveStart = value.indexOf('【O】', cursor);
    const keyResultStart = value.indexOf('【KR】', cursor);
    const starts = [objectiveStart, keyResultStart].filter(index => index >= 0);
    if (starts.length === 0) break;

    const start = Math.min(...starts);
    const kind: ReferenceKind = start === keyResultStart ? 'kr' : 'o';
    const metricStart = value.indexOf('（完成度 ', start);
    const close = metricStart < 0 ? -1 : value.indexOf('）', metricStart);
    if (metricStart < 0 || close < 0) {
      output += value.slice(cursor, start + (kind === 'kr' ? 4 : 3));
      cursor = start + (kind === 'kr' ? 4 : 3);
      continue;
    }

    const resolved = resolveLegacyReference(kind, value.slice(start, metricStart), objectives);
    if (!resolved) {
      output += value.slice(cursor, close + 1);
    } else {
      output += value.slice(cursor, start) + okrReferenceToken(resolved.kind, resolved.id);
    }
    cursor = close + 1;
  }
  return output + value.slice(cursor);
}

function getReferenceParts(value: string, objectives: Objective[]) {
  const normalized = normalizeLegacyReferences(value, objectives);
  const parts: Array<string | ReferencePart> = [];
  let cursor = 0;
  for (const match of normalized.matchAll(tokenPattern)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push(normalized.slice(cursor, start));
    parts.push({ kind: match[1] as ReferenceKind, id: Number(match[2]) });
    cursor = start + match[0].length;
  }
  if (cursor < normalized.length) parts.push(normalized.slice(cursor));
  return parts;
}

function progressDetails(keyResult: KeyResult) {
  if (keyResult.type !== 1) return null;
  const target = keyResult.target as Record<string, unknown>;
  const targetValue = target.value ?? '?';
  const unit = typeof target.unit === 'string' && target.unit ? ` ${target.unit}` : '';
  return `当前值 ${keyResult.current_value ?? 0}/${targetValue}${unit}`;
}

function ReferenceChip({ kind, id, objectives }: ReferencePart & { objectives: Objective[] }) {
  const reference = findReference(kind, id, objectives);
  const badge = kind === 'o' ? 'O' : 'KR';
  if (!reference) {
    return (
      <span className={`${styles.referenceChip} ${styles.missingReference}`} contentEditable={false}>
        <span className={styles.referenceBadge}>{badge}</span>
        <span>已删除的 {badge}</span>
      </span>
    );
  }

  const { objective, keyResult } = reference;
  const title = keyResult ? `${objective.title} / ${keyResult.title}` : objective.title;
  const progress = keyResult?.progress ?? objective.progress;
  const details = keyResult ? progressDetails(keyResult) : null;
  const accessibleLabel = `${badge}：${title}（完成度 ${progress}%${details ? `，${details}` : ''}）`;

  return (
    <span className={styles.referenceChip} data-kind={kind} title={accessibleLabel} aria-label={accessibleLabel} contentEditable={false}>
      <span className={styles.referenceBadge}>{badge}</span>
      <span className={styles.referenceTitle}>{title}</span>
      <span className={styles.referenceProgress}>完成度 {progress}%</span>
      {details && <span className={styles.referenceDetails}>{details}</span>}
    </span>
  );
}

export function OkrReferenceText({ value, objectives }: { value: string; objectives: Objective[] }) {
  return (
    <>
      {getReferenceParts(value, objectives).map((part, index) => typeof part === 'string'
        ? <Fragment key={`text-${index}`}>{part}</Fragment>
        : <ReferenceChip key={`reference-${index}-${part.kind}-${part.id}`} {...part} objectives={objectives} />)}
    </>
  );
}

function createChipNode(kind: ReferenceKind, id: number, objectives: Objective[]) {
  const span = document.createElement('span');
  span.className = styles.referenceChip;
  span.contentEditable = 'false';
  span.dataset.okrRef = kind;
  span.dataset.okrId = String(id);

  const reference = findReference(kind, id, objectives);
  const badge = document.createElement('span');
  badge.className = styles.referenceBadge;
  badge.textContent = kind === 'o' ? 'O' : 'KR';
  span.append(badge);
  if (!reference) {
    span.classList.add(styles.missingReference);
    const missing = document.createElement('span');
    missing.textContent = `已删除的 ${kind === 'o' ? 'O' : 'KR'}`;
    span.append(missing);
    return span;
  }

  const { objective, keyResult } = reference;
  const title = document.createElement('span');
  title.className = styles.referenceTitle;
  title.textContent = keyResult ? `${objective.title} / ${keyResult.title}` : objective.title;
  const progress = document.createElement('span');
  progress.className = styles.referenceProgress;
  progress.textContent = `完成度 ${keyResult?.progress ?? objective.progress}%`;
  span.append(title, progress);
  const detailsText = keyResult ? progressDetails(keyResult) : null;
  if (detailsText) {
    const details = document.createElement('span');
    details.className = styles.referenceDetails;
    details.textContent = detailsText;
    span.append(details);
  }
  return span;
}

function appendTextWithBreaks(parent: DocumentFragment, value: string) {
  const lines = value.split('\n');
  lines.forEach((line, index) => {
    if (line) parent.append(document.createTextNode(line));
    if (index < lines.length - 1) parent.append(document.createElement('br'));
  });
}

function renderValue(root: HTMLDivElement, value: string, objectives: Objective[]) {
  const fragment = document.createDocumentFragment();
  for (const part of getReferenceParts(value, objectives)) {
    if (typeof part === 'string') appendTextWithBreaks(fragment, part);
    else fragment.append(createChipNode(part.kind, part.id, objectives));
  }
  root.replaceChildren(fragment);
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const element = node as HTMLElement;
  const kind = element.dataset.okrRef;
  const id = Number(element.dataset.okrId);
  if ((kind === 'o' || kind === 'kr') && Number.isInteger(id)) return okrReferenceToken(kind, id);
  if (element.tagName === 'BR') return '\n';
  return Array.from(element.childNodes).map(serializeNode).join('');
}

function clampValue(value: string, maxLength?: number) {
  if (!maxLength || value.length <= maxLength) return value;
  let output = '';
  let cursor = 0;
  for (const match of value.matchAll(tokenPattern)) {
    const start = match.index ?? 0;
    const plain = value.slice(cursor, start);
    const remaining = maxLength - output.length;
    if (plain.length >= remaining) return output + plain.slice(0, Math.max(remaining, 0));
    output += plain;
    const token = match[0];
    if (output.length + token.length > maxLength) return output;
    output += token;
    cursor = start + token.length;
  }
  return output + value.slice(cursor, cursor + Math.max(maxLength - output.length, 0));
}

export const OkrReferenceEditor = forwardRef<OkrReferenceEditorHandle, OkrReferenceEditorProps>(function OkrReferenceEditor({
  value,
  objectives,
  placeholder,
  disabled = false,
  maxLength,
  className,
  id,
  onChange,
}, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const renderedValueRef = useRef('');
  const renderedObjectiveSignatureRef = useRef('');
  const objectiveSignature = JSON.stringify(objectives.map(objective => [
    objective.id,
    objective.title,
    objective.progress,
    objective.key_results.map(keyResult => [
      keyResult.id,
      keyResult.title,
      keyResult.progress,
      keyResult.current_value,
      keyResult.target,
    ]),
  ]));

  const rememberSelection = () => {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (root && selection?.rangeCount && root.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const emitChange = () => {
    const root = rootRef.current;
    if (!root) return;
    rememberSelection();
    const serialized = serializeNode(root);
    const nextValue = clampValue(serialized, maxLength);
    if (serialized !== nextValue) {
      renderValue(root, nextValue, objectives);
      selectionRef.current = null;
    }
    renderedValueRef.current = nextValue;
    onChange(nextValue);
  };

  const insertNodes = (nodes: Node[]) => {
    const root = rootRef.current;
    if (!root || disabled) return;
    root.focus();
    const selection = window.getSelection();
    let range = selectionRef.current?.cloneRange() ?? (selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null);
    if (!range || !root.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);
    }
    range.deleteContents();
    let lastNode: Node | null = null;
    for (const node of nodes) {
      range.insertNode(node);
      lastNode = node;
      range.setStartAfter(node);
      range.collapse(true);
    }
    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      selectionRef.current = nextRange.cloneRange();
    }
    emitChange();
  };

  useImperativeHandle(ref, () => ({
    insertReference(kind, referenceId) {
      const chip = createChipNode(kind, referenceId, objectives);
      const spacer = document.createTextNode(' ');
      insertNodes([chip, spacer]);
    },
  }), [objectives, disabled]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (
      serializeNode(root) === value
      && renderedValueRef.current === value
      && renderedObjectiveSignatureRef.current === objectiveSignature
    ) return;
    renderValue(root, value, objectives);
    renderedValueRef.current = value;
    renderedObjectiveSignatureRef.current = objectiveSignature;
    selectionRef.current = null;
  }, [value, objectiveSignature]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    insertNodes([document.createElement('br')]);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text/plain');
    const fragment = document.createDocumentFragment();
    appendTextWithBreaks(fragment, pastedText);
    insertNodes(Array.from(fragment.childNodes));
  };

  return (
    <div
      id={id}
      ref={rootRef}
      className={`${styles.editor} ${className ?? ''}`}
      contentEditable={!disabled}
      role="textbox"
      aria-multiline="true"
      aria-disabled={disabled}
      data-placeholder={placeholder}
      suppressContentEditableWarning
      onInput={emitChange}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
      onBlur={rememberSelection}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
});
