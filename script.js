class CardGallery {
    constructor() {
        this.cards = [];
        this.filteredCards = [];
        this.currentView = 'grid';
        this.filters = {
            type: 'all',
            deck: 'all',
            category: 'all',
            search: '',
            players: 'all'
        };

        this.init();
    }

    async init() {
        // 加载卡牌数据
        await this.loadCards();

        // 初始化UI
        this.initUI();

        // 渲染卡牌
        this.renderCards();

        // 更新统计数据
        this.updateStats();
    }

    async loadCards() {
        try {
            // 从本地JSON文件加载数据
            const response = await fetch('cards.json');
            if (!response.ok) {
                throw new Error('无法加载卡牌数据');
            }

            const cardsData = await response.json();

            // 转换为数组并格式化数据
            this.cards = Object.values(cardsData);

            console.log(`成功加载 ${this.cards.length} 张卡牌`);

        } catch (error) {
            console.error('加载卡牌数据失败:', error);
            this.showErrorMessage('加载卡牌数据失败，请刷新页面重试。');
        }
    }

    formatCategory(category) {
        if (!category) return '其他';

        // 简化分类显示
        const categoryMap = {
            'BUILDING_RESOURCES_-_ALL': '建造资源',
            'FARM_SPACE_ACTIONS': '农场行动',
            'FOOD_GENERATION': '食物生成',
            'ANIMAL_ACTIONS': '动物行动',
            'FIELD_ACTIONS': '田地行动',
            'FAMILY_ACTIONS': '家庭行动'
        };

        return categoryMap[category] || category.replace(/_/g, ' ');
    }

    initUI() {
        // 初始化筛选器
        this.initFilters();

        // 初始化视图切换
        this.initViewControls();

        // 初始化排序
        this.initSortControls();
    }

    initFilters() {
        // 卡牌类型筛选
        document.getElementById('cardType').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });

        // 扩展包筛选
        document.getElementById('deckFilter').addEventListener('change', (e) => {
            this.filters.deck = e.target.value;
            this.applyFilters();
        });

        // 分类筛选
        const categorySelect = document.getElementById('categoryFilter');
        const categories = [...new Set(this.cards.map(card => this.formatCategory(card.category)))].sort();

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        // 搜索框
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // 玩家人数筛选
        document.getElementById('playersFilter').addEventListener('change', (e) => {
            this.filters.players = e.target.value;
            this.applyFilters();
        });

        // 重置按钮
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });
    }

    initViewControls() {
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的active类
                viewBtns.forEach(b => b.classList.remove('active'));
                // 为点击的按钮添加active类
                btn.classList.add('active');

                this.currentView = btn.dataset.view;
                this.renderCards();
            });
        });
    }

    initSortControls() {
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortCards(e.target.value);
            this.renderCards();
        });
    }

    applyFilters() {
        this.filteredCards = this.cards.filter(card => {
            // 类型筛选
            if (this.filters.type !== 'all' && card.type !== this.filters.type) {
                return false;
            }

            // 扩展包筛选
            if (this.filters.deck !== 'all' && card.deck !== this.filters.deck) {
                return false;
            }

            // 分类筛选
            if (this.filters.category !== 'all' && this.formatCategory(card.category) !== this.filters.category) {
                return false;
            }

            // 搜索筛选
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                const nameMatch = card.name.toLowerCase().includes(searchLower);
                const numberMatch = card.numbering.toLowerCase().includes(searchLower);
                const descMatch = card.description.toLowerCase().includes(searchLower);

                if (!nameMatch && !numberMatch && !descMatch) {
                    return false;
                }
            }

            // 玩家人数筛选
            if (this.filters.players !== 'all') {
                const playersStr = card.players || '';
                if (this.filters.players === '1-4' && playersStr.includes('5+')) {
                    return false;
                }
                if (this.filters.players === '5-7' && !playersStr.includes('5+')) {
                    return false;
                }
            }

            return true;
        });

        // 默认按编号排序
        this.sortCards('numbering');
        this.renderCards();
        this.updateStats();
    }

    sortCards(sortBy) {
        this.filteredCards.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'deck':
                    return a.deck.localeCompare(b.deck) ||
                        a.numbering.localeCompare(b.numbering);
                case 'vp':
                    return (b.vp || 0) - (a.vp || 0);
                default: // numbering
                    return a.numbering.localeCompare(b.numbering);
            }
        });
    }

    resetFilters() {
        // 重置筛选器UI
        document.getElementById('cardType').value = 'all';
        document.getElementById('deckFilter').value = 'all';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        document.getElementById('playersFilter').value = 'all';

        // 重置筛选状态
        this.filters = {
            type: 'all',
            deck: 'all',
            category: 'all',
            search: '',
            players: 'all'
        };

        // 重新应用筛选
        this.applyFilters();
    }

    renderCards() {
        if (this.currentView === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }

    renderGridView() {
        const container = document.getElementById('cardsGrid');
        const listContainer = document.getElementById('cardsList');

        // 显示网格容器，隐藏列表容器
        container.style.display = 'grid';
        listContainer.style.display = 'none';

        if (this.filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-folder-open"></i>
                    <h3>没有找到匹配的卡牌</h3>
                    <p>尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            return;
        }

        // 清空容器
        container.innerHTML = '';

        // 创建卡牌并添加到容器
        this.filteredCards.forEach(card => {
            const cardElement = this.createAgricolaCardHTML(card);
            container.appendChild(cardElement);
        });
    }

    renderListView() {
        const container = document.getElementById('cardsList');
        const gridContainer = document.getElementById('cardsGrid');

        // 显示列表容器，隐藏网格容器
        container.style.display = 'block';
        gridContainer.style.display = 'none';

        if (this.filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-folder-open"></i>
                    <h3>没有找到匹配的卡牌</h3>
                    <p>尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            return;
        }

        const listHTML = this.filteredCards.map(card => this.createListCardHTML(card)).join('');
        container.innerHTML = listHTML;
    }

    // 根据Cards.js中的tplPlayerCard函数创建Agricola风格的卡牌
    createAgricolaCardHTML(card) {
        const div = document.createElement('div');

        // 基础样式类
        const typeClass = card.type || 'minor';
        const classes = [
            'player-card',
            typeClass,
            'tooltipable',
            'selectable'
        ].filter(c => c).join(' ');

        // 设置数据属性
        div.id = card.id;
        div.className = classes;
        div.setAttribute('data-id', card.id);
        div.setAttribute('data-numbering', card.numbering);
        div.setAttribute('data-cook', card.cook || 'false');
        div.setAttribute('data-bread', card.bread || 'false');
        div.setAttribute('data-state', card.state || '0');

        // 创建卡牌内部结构
        const html = `
            <div class="player-card-resizable">
                <div class="player-card-inner">
                    <div class="card-frame"></div>
                    ${card.passing !== true ? '<div class="card-frame-left-leaves"></div><div class="card-frame-right-leaves"></div>' : ''}
                    <div class="card-icon"></div>
                    <div class="card-title">
                        ${card.name || ''}
                    </div>
                    <div class="card-numbering">${card.numbering || ''}</div>
                    <div class="card-bonus-vp-counter">${card.bonusVp || ''}</div>
                    ${card.players ? `<div class="card-players" data-n="${card.players}"></div>` : ''}
                    ${card.deck ? `<div class="card-deck" data-deck="${card.deck}"></div>` : ''}
                    ${card.vp != 0 ? `<div class="card-score" data-score="${card.vp}">${card.vp}</div>` : ''}
                    ${card.extraVp ? '<div class="card-extra-score"></div>' : ''}
                    ${card.category ? `<div class="card-category" data-category="${card.category}"></div>` : ''}
                    <div class="card-cost">
                        ${this.formatCardCostHTML(card)}
                    </div>
                    ${this.formatPrerequisiteHTML(card)}
                    <div class="card-desc">
                        <div class="card-desc-scroller">
                            ${this.formatCardDescription(card)}
                        </div>
                    </div>
                    <div class="card-bottom-left-corner"></div>
                    <div class="card-bottom-right-corner"></div>
                    ${card.holder ? this.createHolderHTML(card) : ''}
                </div>
                <div class="player-card-zoom">
                    <svg><use href="#zoom-svg"></use></svg>
                </div>
            </div>
            <div class="player-card-stats"></div>
            ${card.field ? '<div class="player-card-field-cell"></div>' : ''}
            ${!card.animalHolder ? '' : '<div class="resource-holder resource-holder-update animal-holder" data-n="0"></div>'}
        `;

        div.innerHTML = html;
        return div;
    }

    formatCardCostHTML(card) {
        // 根据Cards.js中的formatCardCost函数实现
        if (!card.costs) return '';

        // 处理费用文本
        let html = '';
        if (card.costText && card.costText !== '') {
            html += `<div class="card-cost-text">${card.costText}</div>`;
        }

        // 处理具体费用
        const costs = Array.isArray(card.costs) ? card.costs : [card.costs];

        costs.forEach((cost, index) => {
            if (Object.keys(cost).length === 0) return;

            const costItems = Object.entries(cost).map(([resource, amount]) => {
                const meepleClass = `meeple-${resource.toLowerCase()}`;
                return `<div>
                    ${amount}<div class="meeple-container">
                        <div class="agricola-meeple ${meepleClass}"></div>
                    </div>
                    </div>
                `;
            }).join('');

            html += `${costItems}`;

            // 添加分隔符（除了最后一个）
            if (index < costs.length - 1) {
                html += '<div class="card-cost-separator"></div>';
            }
        });

        // 处理额外费用
        if (card.fee) {
            const feeItems = Object.entries(card.fee).map(([resource, amount]) => {
                const meepleClass = `meeple-${resource.toLowerCase()}`;
                return `
                    <div class="meeple-container">
                        <div class="agricola-meeple ${meepleClass}"></div>
                    </div>
                    <span>${amount}</span>
                `;
            }).join('');

            html = `
                <div class="card-fee">${feeItems}</div>
                <div class="card-cost-fee-separator">+</div>
                ${html}
            `;
        }

        return html;
    }

    formatPrerequisiteHTML(card) {
        if (!card.prerequisite || card.prerequisite === '') return '';

        return `
            <div class="card-prerequisite">
                <div class="prerequisite-text">${card.prerequisite}</div>
            </div>
        `;
    }

    formatCardDescription(card) {
        // 直接从card对象获取描述
        return card.description || card.desc || '';
    }

    createHolderHTML(card) {
        let subHolders = '';
        if (card.id === "D75_WoodField") {
            subHolders = '<div class="subholder" data-x="0"></div><div class="subholder" data-x="-1"></div>';
        }
        if (card.id === "E80_RockGarden") {
            subHolders = '<div class="subholder" data-x="0"></div><div class="subholder" data-x="-1"></div><div class="subholder" data-x="-2"></div>';
        }

        return `
            <div class="resource-holder farmer-holder resource-holder-update ${card.actionCard ? 'actionCard' : ''}">
                ${subHolders}
            </div>
        `;
    }

    createListCardHTML(card) {
        const typeText = card.type === 'occupation' ? '职业卡' : '次要改进卡';
        const vpDisplay = card.vp > 0 ? `+${card.vp}` : '0';

        return `
            <div class="card-list-item" data-id="${card.id}">
                <div class="list-card-number">${card.numbering}</div>
                <div class="list-card-name">${card.name}</div>
                <div class="list-card-type">${typeText}</div>
                <div class="list-card-vp">${vpDisplay} VP</div>
            </div>
        `;
    }

    updateStats() {
        document.getElementById('totalCards').textContent = this.cards.length;
        document.getElementById('showingCards').textContent = this.filteredCards.length;
    }

    showErrorMessage(message) {
        const container = document.getElementById('cardsGrid');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new CardGallery();

    // 将实例附加到window对象，方便调试
    window.cardGallery = gallery;
});