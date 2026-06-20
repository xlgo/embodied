// ==========================================================================
// GB28281 Device Governance UI - Interaction Logic
// ==========================================================================

// --- 初始数据模型 (Mock Data) ---

// 组织机构树结构
let orgData = {
  id: "root",
  name: "市公安局",
  children: [
    {
      id: "district-1",
      name: "天山区公安分局",
      children: [
        { id: "sub-1", name: "解放路派出所", children: [] },
        { id: "sub-2", name: "大小西门派出所", children: [] },
        { id: "sub-3", name: "新华南路派出所", children: [] }
      ]
    },
    {
      id: "district-2",
      name: "沙依巴克区公安分局",
      children: [
        { id: "sub-4", name: "友好南路派出所", children: [] },
        { id: "sub-5", name: "八一派出所", children: [] }
      ]
    },
    {
      id: "district-3",
      name: "高新技术开发区公安分局",
      children: [
        { id: "sub-6", name: "北京路派出所", children: [] }
      ]
    }
  ]
};

// 设备列表数据
let devices = [
  { id: "d1", name: "天山区南门高清球机", code: "34020000001320000001", ip: "10.43.12.101", channels: 1, status: "online", orgId: "sub-1" },
  { id: "d2", name: "二道桥大巴扎入口枪机", code: "34020000001310000002", ip: "10.43.12.102", channels: 1, status: "online", orgId: "sub-1" },
  { id: "d3", name: "大小西门地下通道全景相机", code: "34020000001320000005", ip: "10.43.15.54", channels: 2, status: "online", orgId: "sub-2" },
  { id: "d4", name: "友好商场西北角高空瞭望", code: "34020000001320000010", ip: "10.44.8.20", channels: 1, status: "offline", orgId: "sub-4" },
  { id: "d5", name: "八一路兵团医院东门", code: "34020000001310000012", ip: "10.44.20.15", channels: 1, status: "online", orgId: "sub-5" },
  { id: "d6", name: "开发区二期主路口NVR接入", code: "34020000001180000025", ip: "10.45.6.8", channels: 16, status: "online", orgId: "sub-6" },
  
  // 未治理设备 (未关联组织机构)
  { id: "d7", name: "新接入测试设备_01", code: "34020000001310000099", ip: "192.168.1.105", channels: 1, status: "online", orgId: null },
  { id: "d8", name: "海康威视NVR_待分配", code: "34020000001180000120", ip: "192.168.2.35", channels: 8, status: "offline", orgId: null },
  { id: "d9", name: "大华枪机_临时调测", code: "34020000001320000456", ip: "192.168.1.189", channels: 1, status: "online", orgId: null },
  { id: "d10", name: "未知编码网络半球", code: "34020000001320000987", ip: "10.99.120.3", channels: 1, status: "online", orgId: null },
  { id: "d11", name: "交警支队路口临时借道枪机", code: "34020000001310000888", ip: "10.88.50.41", channels: 1, status: "offline", orgId: null },
];

// 用于设备导入的模拟数据
const mockImportFilesData = [
  { name: "天山区人民路天桥枪机", code: "34020000001310001001", ip: "10.43.14.88", orgName: "解放路派出所", orgId: "sub-1", status: "valid", reason: "验证成功" },
  { name: "沙区平顶山小区高架枪机", code: "34020000001310001002", ip: "10.44.22.99", orgName: "八一派出所", orgId: "sub-5", status: "valid", reason: "验证成功" },
  { name: "新导入待定设备", code: "34020000001310001003", ip: "10.43.20.12", orgName: "未分配", orgId: null, status: "valid", reason: "验证成功" },
  { name: "非法编码球机", code: "3402000099", ip: "192.168.8.10", orgName: "北京路派出所", orgId: "sub-6", status: "invalid", reason: "国标编码不是20位数字" },
  { name: "IP冲突摄像头", code: "34020000001320001004", ip: "10.43.12.101", orgName: "解放路派出所", orgId: "sub-1", status: "invalid", reason: "设备IP在系统中已存在" }
];

// 全局选择状态
let currentSelectedOrgId = "all";
let selectedDeviceIds = new Set();
let draggedElement = null;

// --- 初始化入口 ---
document.addEventListener("DOMContentLoaded", () => {
  initOrgTree();
  renderDeviceList();
  updateOverviewStats();
  initEventHandlers();
});

// --- 组织机构树生成 ---
function initOrgTree() {
  const treeContainer = document.getElementById("org-tree-root");
  const assignTreeContainer = document.getElementById("assign-org-tree");
  
  // 主界面的组织树包含“全部”和“未治理”虚拟节点
  let mainTreeHtml = `
    <div class="tree-node">
      <div class="tree-node-content active" data-id="all">
        <span class="tree-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
          </svg>
        </span>
        <span class="tree-label">全部接入设备</span>
        <span class="tree-count" id="count-all">0</span>
      </div>
    </div>
    <div class="tree-node">
      <div class="tree-node-content" data-id="ungoverned">
        <span class="tree-icon" style="color: hsl(var(--warning));">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
        <span class="tree-label" style="color: hsl(var(--warning));">未治理设备</span>
        <span class="tree-count" id="count-ungoverned" style="color: hsl(var(--warning));">0</span>
      </div>
    </div>
    <div class="tree-divider" style="height: 1px; background: hsla(var(--border), 0.5); margin: 8px 4px;"></div>
  `;

  mainTreeHtml += buildTreeHtml(orgData);
  treeContainer.innerHTML = mainTreeHtml;
  
  // 批量分配弹窗的组织树（不包含“全部”和“未治理”）
  assignTreeContainer.innerHTML = buildTreeHtml(orgData);

  // 绑定树节点展开折叠和选择逻辑
  bindTreeEvents();
  updateTreeCounts();
}

function buildTreeHtml(node) {
  const hasChildren = node.children && node.children.length > 0;
  
  return `
    <div class="tree-node" data-id="${node.id}">
      <div class="tree-node-content" data-id="${node.id}" draggable="false">
        ${hasChildren ? `
          <span class="tree-toggle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
        ` : `<span class="tree-toggle" style="visibility: hidden;"></span>`}
        <span class="tree-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span class="tree-label">${node.name}</span>
        <span class="tree-count" data-counter-id="${node.id}">0</span>
      </div>
      ${hasChildren ? `
        <div class="tree-children">
          ${node.children.map(child => buildTreeHtml(child)).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

// 获取某组织下的所有子组织ID（包括自身）
function getOrgDescendantIds(orgId) {
  if (orgId === "all" || orgId === "ungoverned") return [orgId];
  
  const ids = [];
  function recurse(node) {
    if (node.id === orgId || ids.length > 0) {
      ids.push(node.id);
      if (node.children) {
        node.children.forEach(child => recurseDirect(child));
      }
      return true;
    }
    if (node.children) {
      for (let child of node.children) {
        if (recurse(child)) return true;
      }
    }
    return false;
  }
  
  function recurseDirect(n) {
    ids.push(n.id);
    if (n.children) {
      n.children.forEach(c => recurseDirect(c));
    }
  }
  
  // 查找并递归
  if (orgData.id === orgId) {
    recurseDirect(orgData);
  } else {
    recurse(orgData);
  }
  return ids;
}

// 统计组织内的设备数
function updateTreeCounts() {
  // 1. 全部
  document.getElementById("count-all").textContent = devices.length;
  // 2. 未治理
  const ungovernedCount = devices.filter(d => !d.orgId).length;
  document.getElementById("count-ungoverned").textContent = ungovernedCount;

  // 递归统计各个组织节点
  function countForNode(node) {
    let count = devices.filter(d => d.orgId === node.id).length;
    if (node.children) {
      node.children.forEach(child => {
        count += countForNode(child);
      });
    }
    const counter = document.querySelector(`[data-counter-id="${node.id}"]`);
    if (counter) counter.textContent = count;
    return count;
  }

  countForNode(orgData);
}

// --- 绑定树组件的各类交互事件 ---
function bindTreeEvents() {
  // 1. 展开/折叠
  document.querySelectorAll(".tree-toggle").forEach(toggle => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle.classList.toggle("expanded");
      const childrenDiv = toggle.closest(".tree-node").querySelector(".tree-children");
      if (childrenDiv) childrenDiv.classList.toggle("expanded");
    });
  });

  // 2. 点击节点过滤设备
  document.querySelectorAll("#org-tree-root .tree-node-content").forEach(nodeContent => {
    nodeContent.addEventListener("click", () => {
      document.querySelectorAll("#org-tree-root .tree-node-content").forEach(el => el.classList.remove("active"));
      nodeContent.classList.add("active");
      
      currentSelectedOrgId = nodeContent.getAttribute("data-id");
      
      // 更新面包屑/标题
      const label = nodeContent.querySelector(".tree-label").textContent;
      document.getElementById("current-org-title").textContent = label;
      
      renderDeviceList();
    });

    // --- 拖拽事件监听：挂载目的组织 ---
    const orgId = nodeContent.getAttribute("data-id");
    
    // “全部接入”和“未治理”为虚拟节点，不可拖入
    if (orgId !== "all" && orgId !== "ungoverned") {
      nodeContent.addEventListener("dragover", (e) => {
        e.preventDefault(); // 允许放置
        nodeContent.classList.add("drag-over");
      });

      nodeContent.addEventListener("dragleave", () => {
        nodeContent.classList.remove("drag-over");
      });

      nodeContent.addEventListener("drop", (e) => {
        e.preventDefault();
        nodeContent.classList.remove("drag-over");
        
        // 获取拖放过来的设备ID
        const deviceId = e.dataTransfer.getData("text/plain");
        if (!deviceId) return;

        // 如果是批量拖拽，或者普通单行拖拽
        if (selectedDeviceIds.has(deviceId)) {
          // 批量拖拽调整
          adjustDevicesOrg(Array.from(selectedDeviceIds), orgId, label);
        } else {
          // 单个拖拽调整
          adjustDevicesOrg([deviceId], orgId, label);
        }
      });
    }
  });

  // 3. 弹窗中的树节点点击选择
  document.querySelectorAll("#assign-org-tree .tree-node-content").forEach(nodeContent => {
    nodeContent.addEventListener("click", () => {
      document.querySelectorAll("#assign-org-tree .tree-node-content").forEach(el => el.classList.remove("active"));
      nodeContent.classList.add("active");
      document.getElementById("btn-confirm-assign").removeAttribute("disabled");
    });
  });
}

// --- 渲染设备列表 ---
function renderDeviceList() {
  const tbody = document.getElementById("device-list-body");
  const emptyState = document.getElementById("empty-state");
  tbody.innerHTML = "";

  const searchText = document.getElementById("device-search").value.toLowerCase();
  const statusFilter = document.getElementById("filter-status").value;
  const govFilter = document.getElementById("filter-governed").value;

  // 获取当前组织和子组织下的所有ID
  const targetOrgIds = getOrgDescendantIds(currentSelectedOrgId);

  // 过滤数据
  const filtered = devices.filter(d => {
    // 1. 组织过滤
    if (currentSelectedOrgId === "ungoverned") {
      if (d.orgId !== null) return false;
    } else if (currentSelectedOrgId !== "all") {
      if (!targetOrgIds.includes(d.orgId)) return false;
    }

    // 2. 搜索框过滤
    if (searchText) {
      const matchName = d.name.toLowerCase().includes(searchText);
      const matchCode = d.code.includes(searchText);
      const matchIp = d.ip.includes(searchText);
      if (!matchName && !matchCode && !matchIp) return false;
    }

    // 3. 在线离线过滤
    if (statusFilter !== "all" && d.status !== statusFilter) return false;

    // 4. 治理状态过滤
    if (govFilter === "yes" && !d.orgId) return false;
    if (govFilter === "no" && d.orgId) return false;

    return true;
  });

  // 更新中部标题数量角标
  document.getElementById("current-org-count").textContent = filtered.length;

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  // 生成表格行
  filtered.forEach(d => {
    const tr = document.createElement("tr");
    tr.setAttribute("draggable", "true");
    tr.setAttribute("data-id", d.id);
    if (selectedDeviceIds.has(d.id)) {
      tr.classList.add("selected");
    }

    // 获取组织全称路径（模拟）
    let orgPathHtml = `<span class="gov-none">未治理</span>`;
    if (d.orgId) {
      const orgName = getOrgNameById(orgData, d.orgId);
      orgPathHtml = `<span class="gov-path">${orgName}</span>`;
    }

    tr.innerHTML = `
      <td>
        <input type="checkbox" class="device-checkbox" data-id="${d.id}" ${selectedDeviceIds.has(d.id) ? "checked" : ""} />
      </td>
      <td>
        <div class="dev-meta">
          <span class="dev-name">${d.name}</span>
          <span class="dev-code">${d.code}</span>
        </div>
      </td>
      <td><span class="dev-ip">${d.ip}</span></td>
      <td><span class="dev-channels">${d.channels} ch</span></td>
      <td>
        <span class="status-badge ${d.status}">${d.status === "online" ? "在线" : "离线"}</span>
      </td>
      <td>
        <div class="gov-cell">${orgPathHtml}</div>
      </td>
      <td>
        <button class="btn-action btn-edit" data-id="${d.id}">编辑</button>
        <button class="btn-action danger btn-delete" data-id="${d.id}">移除</button>
      </td>
    `;

    // --- 行拖拽事件处理 ---
    tr.addEventListener("dragstart", (e) => {
      draggedElement = tr;
      tr.classList.add("dragging");
      e.dataTransfer.setData("text/plain", d.id);
      
      // 如果拖拽的行没有被勾选，则清空其他的选择，仅选择当前行
      if (!selectedDeviceIds.has(d.id)) {
        selectedDeviceIds.clear();
        selectedDeviceIds.add(d.id);
        document.querySelectorAll(".device-checkbox").forEach(cb => cb.checked = false);
        const cb = tr.querySelector(".device-checkbox");
        if (cb) cb.checked = true;
        updateBatchActionBar();
      }
    });

    tr.addEventListener("dragend", () => {
      tr.classList.remove("dragging");
      draggedElement = null;
    });

    tbody.appendChild(tr);
  });

  // 重新绑定行内操作按钮和多选框事件
  bindTableActionEvents();
}

function getOrgNameById(rootNode, id) {
  if (rootNode.id === id) return rootNode.name;
  if (rootNode.children) {
    for (let child of rootNode.children) {
      const name = getOrgNameById(child, id);
      if (name) return name;
    }
  }
  return null;
}

// --- 表格内事件绑定 ---
function bindTableActionEvents() {
  // 1. 单选框勾选
  document.querySelectorAll(".device-checkbox").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const id = cb.getAttribute("data-id");
      const tr = cb.closest("tr");
      if (cb.checked) {
        selectedDeviceIds.add(id);
        tr.classList.add("selected");
      } else {
        selectedDeviceIds.delete(id);
        tr.classList.remove("selected");
      }
      updateBatchActionBar();
    });
  });

  // 防止点击勾选框或操作按钮时触发拖拽
  document.querySelectorAll(".device-checkbox, .btn-action").forEach(el => {
    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
  });

  // 2. 移除设备
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const dev = devices.find(d => d.id === id);
      if (confirm(`确定要将设备 [${dev.name}] 离线并从治理平台移除吗？`)) {
        devices = devices.filter(d => d.id !== id);
        selectedDeviceIds.delete(id);
        showToast(`设备 ${dev.name} 移除成功`, "success");
        refreshAll();
      }
    });
  });
}

// --- 批量操作栏状态更新 ---
function updateBatchActionBar() {
  const bar = document.getElementById("batch-actions-bar");
  const countSpan = document.getElementById("selected-count");
  const checkAll = document.getElementById("check-all");

  if (selectedDeviceIds.size > 0) {
    bar.classList.remove("hidden");
    countSpan.textContent = selectedDeviceIds.size;
  } else {
    bar.classList.add("hidden");
  }

  // 检查是否全选
  const visibleCheckboxes = document.querySelectorAll(".device-checkbox");
  if (visibleCheckboxes.length > 0) {
    const allChecked = Array.from(visibleCheckboxes).every(cb => cb.checked);
    checkAll.checked = allChecked;
  } else {
    checkAll.checked = false;
  }
}

// --- 调整设备所属组织的核心逻辑 ---
function adjustDevicesOrg(deviceIds, targetOrgId, targetOrgName) {
  devices.forEach(d => {
    if (deviceIds.includes(d.id)) {
      d.orgId = targetOrgId;
    }
  });

  // 提示信息
  const count = deviceIds.length;
  showToast(`成功将 ${count} 个设备移动至 [${targetOrgName}]`, "success");

  // 清空选择
  selectedDeviceIds.clear();
  
  refreshAll();
}

// --- 刷新整个页面状态 ---
function refreshAll() {
  renderDeviceList();
  updateTreeCounts();
  updateOverviewStats();
  updateBatchActionBar();
}

// --- 全局统计看板更新 ---
function updateOverviewStats() {
  // 1. 总设备数
  document.getElementById("stat-total").textContent = devices.length;

  // 2. 在线率
  const onlineCount = devices.filter(d => d.status === "online").length;
  const rate = devices.length > 0 ? ((onlineCount / devices.length) * 100).toFixed(1) : 0;
  document.getElementById("stat-online-rate").textContent = `${rate}%`;

  // 3. 未治理设备
  const unassigned = devices.filter(d => !d.orgId).length;
  document.getElementById("stat-unassigned").textContent = unassigned;
}

// --- 吐司气泡提示组件 ---
function showToast(message, type = "info") {
  const container = document.getElementById("notification-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  // 区分类型图标
  let icon = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  `;
  if (type === "success") {
    icon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
  } else if (type === "danger" || type === "warning") {
    icon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `;
  }

  toast.innerHTML = `
    ${icon}
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);

  // 3秒后淡出并销毁
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- 事件监听与处理绑定 ---
function initEventHandlers() {
  // 1. 全选/反选
  document.getElementById("check-all").addEventListener("change", (e) => {
    const checked = e.target.checked;
    document.querySelectorAll(".device-checkbox").forEach(cb => {
      cb.checked = checked;
      const id = cb.getAttribute("data-id");
      const tr = cb.closest("tr");
      if (checked) {
        selectedDeviceIds.add(id);
        tr.classList.add("selected");
      } else {
        selectedDeviceIds.delete(id);
        tr.classList.remove("selected");
      }
    });
    updateBatchActionBar();
  });

  // 2. 搜索框过滤事件
  document.getElementById("device-search").addEventListener("input", renderDeviceList);
  document.getElementById("filter-status").addEventListener("change", renderDeviceList);
  document.getElementById("filter-governed").addEventListener("change", renderDeviceList);

  // 3. 组织树本地搜索
  document.getElementById("org-search").addEventListener("input", (e) => {
    const val = e.target.value.trim().toLowerCase();
    document.querySelectorAll("#org-tree-root .tree-node").forEach(node => {
      const label = node.querySelector(".tree-label").textContent.toLowerCase();
      const orgId = node.getAttribute("data-id");
      if (orgId === "all" || orgId === "ungoverned") return;

      if (label.includes(val)) {
        node.style.display = "block";
      } else {
        node.style.display = "none";
      }
    });
  });

  // 4. 批量更改归属组织弹窗交互
  const modalAssign = document.getElementById("modal-assign");
  document.getElementById("btn-batch-assign").addEventListener("click", () => {
    document.getElementById("assign-device-count").textContent = selectedDeviceIds.size;
    modalAssign.classList.remove("hidden");
    // 重置弹窗内树的选中状态
    document.querySelectorAll("#assign-org-tree .tree-node-content").forEach(el => el.classList.remove("active"));
    document.getElementById("btn-confirm-assign").setAttribute("disabled", "true");
  });

  document.getElementById("btn-close-assign").addEventListener("click", () => modalAssign.classList.add("hidden"));
  document.getElementById("btn-cancel-assign").addEventListener("click", () => modalAssign.classList.add("hidden"));
  
  document.getElementById("btn-confirm-assign").addEventListener("click", () => {
    const selectedNode = document.querySelector("#assign-org-tree .tree-node-content.active");
    if (!selectedNode) return;

    const targetOrgId = selectedNode.getAttribute("data-id");
    const targetOrgName = selectedNode.querySelector(".tree-label").textContent;

    adjustDevicesOrg(Array.from(selectedDeviceIds), targetOrgId, targetOrgName);
    modalAssign.classList.add("hidden");
  });

  // 5. 批量下线模拟
  document.getElementById("btn-batch-delete").addEventListener("click", () => {
    if (confirm(`确定要将所选的 ${selectedDeviceIds.size} 台设备批量下线吗？`)) {
      const ids = Array.from(selectedDeviceIds);
      devices = devices.filter(d => !ids.includes(d.id));
      selectedDeviceIds.clear();
      showToast("所选设备批量下线成功", "success");
      refreshAll();
    }
  });

  // --- 导入设备弹窗交互逻辑 ---
  const modalImport = document.getElementById("modal-import");
  const stepUpload = document.getElementById("import-step-upload");
  const stepPreview = document.getElementById("import-step-preview");
  const btnSubmitImport = document.getElementById("btn-submit-import");
  const fileInput = document.getElementById("file-input");
  const dropzone = document.getElementById("dropzone");

  // 打开导入弹窗
  document.getElementById("btn-open-import").addEventListener("click", () => {
    modalImport.classList.remove("hidden");
    // 重置状态
    stepUpload.classList.remove("hidden");
    stepPreview.classList.add("hidden");
    btnSubmitImport.classList.add("hidden");
    fileInput.value = "";
  });

  // 关闭导入弹窗
  document.getElementById("btn-close-import").addEventListener("click", () => modalImport.classList.add("hidden"));
  document.getElementById("btn-cancel-import").addEventListener("click", () => modalImport.classList.add("hidden"));

  // 点击上传区域触发 file click
  dropzone.addEventListener("click", () => fileInput.click());

  // 拖拽文件样式响应
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleUploadedFile(e.target.files[0]);
    }
  });

  // 模拟文件校验逻辑
  function handleUploadedFile(file) {
    showToast(`成功读取文件: ${file.name}，正在进行国标参数合规性校验...`, "info");
    
    // 动画延时，假装在解析并检验
    setTimeout(() => {
      stepUpload.classList.add("hidden");
      stepPreview.classList.remove("hidden");
      btnSubmitImport.classList.remove("hidden");

      // 填充预览数据
      const tbody = document.getElementById("preview-list-body");
      tbody.innerHTML = "";

      let validCount = 0;
      let invalidCount = 0;

      mockImportFilesData.forEach(item => {
        const tr = document.createElement("tr");
        
        let statusBadge = "";
        if (item.status === "valid") {
          statusBadge = `<span class="valid-status ok">校验成功</span>`;
          validCount++;
        } else {
          statusBadge = `<span class="valid-status err" title="${item.reason}">校验失败</span>`;
          invalidCount++;
        }

        tr.innerHTML = `
          <td>${item.name}</td>
          <td><span style="font-family: monospace;">${item.code}</span></td>
          <td><span style="font-family: monospace;">${item.ip}</span></td>
          <td>${item.orgName}</td>
          <td>
            ${statusBadge}
            ${item.status === "invalid" ? `<div style="font-size: 0.7rem; color: hsl(var(--danger)); margin-top: 2px;">${item.reason}</div>` : ""}
          </td>
        `;
        tbody.appendChild(tr);
      });

      // 更新校验统计
      document.getElementById("valid-count").textContent = validCount;
      document.getElementById("invalid-count").textContent = invalidCount;
      document.getElementById("import-submit-text").textContent = validCount;

      // 允许点击“确认导入”按钮（如果有效数 > 0）
      if (validCount > 0) {
        btnSubmitImport.removeAttribute("disabled");
      } else {
        btnSubmitImport.setAttribute("disabled", "true");
      }

    }, 1200);
  }

  // 确定导入
  btnSubmitImport.addEventListener("click", () => {
    // 将合法的数据加入原设备列表
    const validItems = mockImportFilesData.filter(i => i.status === "valid");
    
    validItems.forEach((item, index) => {
      devices.unshift({
        id: `import-${Date.now()}-${index}`,
        name: item.name,
        code: item.code,
        ip: item.ip,
        channels: 1,
        status: "online",
        orgId: item.orgId
      });
    });

    showToast(`成功导入 ${validItems.length} 台设备！并已自动关联匹配的组织。`, "success");
    modalImport.classList.add("hidden");
    
    refreshAll();
  });
}
