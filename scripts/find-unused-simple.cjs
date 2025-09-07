#!/usr/bin/env node
"use strict";

/*
  scripts/find-unused-simple.cjs

  간단한 미사용 파일 탐지 스크립트
  복잡한 의존성 분석 대신 파일명 기반 검색 사용

  Usage:
    node scripts/find-unused-simple.cjs
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const IGNORES = ['node_modules', '.git', 'dist', 'build', 'public', '.vite'];

function walk(dir, ignores = IGNORES) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignores.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath, ignores));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // 디렉토리 접근 실패 시 무시
  }
  return files;
}

function findFileReferences(filePath, allFiles) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = path.relative(ROOT, filePath);

  for (const otherFile of allFiles) {
    if (otherFile === filePath) continue;
    try {
      const content = fs.readFileSync(otherFile, 'utf8');
      // 파일명으로 검색 (import, require, 텍스트 내 언급)
      if (content.includes(fileName) || content.includes(relativePath)) {
        return true;
      }
    } catch (e) {
      // 파일 읽기 실패 시 무시
    }
  }
  return false;
}

function main() {
  console.log('🔍 간단한 미사용 파일 탐지 시작...\n');

  const allFiles = walk(SRC);
  console.log(`📁 총 ${allFiles.length}개 파일 발견`);

  const unusedCandidates = [];

  for (const file of allFiles) {
    const isReferenced = findFileReferences(file, allFiles);
    if (!isReferenced) {
      unusedCandidates.push(file);
    }
  }

  console.log(`✅ 사용된 파일: ${allFiles.length - unusedCandidates.length}`);
  console.log(`❓ 미사용 후보: ${unusedCandidates.length}`);

  if (unusedCandidates.length > 0) {
    console.log('\n=== 미사용 파일 후보들 ===');
    unusedCandidates.forEach(file => {
      console.log(`- ${path.relative(ROOT, file)}`);
    });
    console.log('\n⚠️  주의: 이 목록은 참고용입니다. 실제 삭제 전 수동 검토하세요.');
  } else {
    console.log('\n🎉 미사용 파일이 발견되지 않았습니다!');
  }

  console.log('\n💡 팁: IDE의 미사용 코드 탐지 기능을 함께 사용해보세요.');
}

if (require.main === module) {
  main();
}
