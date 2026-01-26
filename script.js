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
            this.cards = Object.values(cardsData).map(card => ({
                ...card,
                vp: parseInt(card.vp) || 0,
                // 添加分类处理
                categoryDisplay: this.formatCategory(card.category)
            }));
            
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
        
        // 初始化模态框
        this.initModal();
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
        const categories = [...new Set(this.cards.map(card => card.categoryDisplay))].sort();
        
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
    
    initModal() {
        const modal = document.getElementById('cardModal');
        const closeBtn = document.querySelector('.close-modal');
        
        // 点击关闭按钮关闭模态框
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
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
            if (this.filters.category !== 'all' && card.categoryDisplay !== this.filters.category) {
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
        
        const cardsHTML = this.filteredCards.map(card => this.createCardHTML(card)).join('');
        container.innerHTML = cardsHTML;
        
        // 为每张卡牌添加点击事件
        document.querySelectorAll('.card-item').forEach((cardElement, index) => {
            cardElement.addEventListener('click', () => {
                this.showCardDetail(this.filteredCards[index]);
            });
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
        
        // 为每行添加点击事件
        document.querySelectorAll('.card-list-item').forEach((row, index) => {
            row.addEventListener('click', () => {
                this.showCardDetail(this.filteredCards[index]);
            });
        });
    }
    
    createCardHTML(card) {
        const typeText = card.type === 'occupation' ? '职业卡' : '次要改进卡';
        const vpDisplay = card.vp > 0 ? `+${card.vp} VP` : '0 VP';
        
        return `
            <div class="card-item" data-id="${card.id}">
                <div class="card-header">
                    <div class="card-number">${card.numbering}</div>
                    <div class="card-name">${card.name}</div>
                    <div class="card-type">${typeText}</div>
                </div>
                <div class="card-body">
                    <div class="card-description">${this.sanitizeDescription(card.description)}</div>
                    <div class="card-category-badge">${card.categoryDisplay}</div>
                </div>
                <div class="card-footer">
                    <div class="card-vp">${vpDisplay}</div>
                    <div class="card-players">
                        <i class="fas fa-users"></i> ${card.players || '1+'} 人
                    </div>
                </div>
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
    
    sanitizeDescription(description) {
        // 移除HTML标签，保留文本内容
        return description.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
    }
    
    showCardDetail(card) {
        const modal = document.getElementById('cardModal');
        const modalName = document.getElementById('modalCardName');
        const modalContent = document.getElementById('modalCardContent');
        
        modalName.textContent = card.name;
        modalContent.innerHTML = this.createCardDetailHTML(card);
        
        modal.style.display = 'block';
    }
    
    createCardDetailHTML(card) {
        const typeText = card.type === 'occupation' ? '职业卡' : '次要改进卡';
        const deckText = this.getDeckName(card.deck);
        const vpDisplay = card.vp > 0 ? `+${card.vp} 胜利分数` : '无胜利分数';
        
        return `
            <div class="card-detail">
                <div class="card-detail-header">
                    <div class="detail-numbering">${card.numbering} | ${deckText}</div>
                    <div class="detail-name">${card.name}</div>
                    <div class="detail-meta">
                        <span class="detail-type">
                            <i class="fas fa-tag"></i> ${typeText}
                        </span>
                        <span class="detail-deck">
                            <i class="fas fa-layer-group"></i> ${deckText}扩展包
                        </span>
                        <span class="detail-players">
                            <i class="fas fa-users"></i> ${card.players || '1+'} 人游戏
                        </span>
                    </div>
                </div>
                
                <div class="card-detail-body">
                    <div class="detail-description">
                        ${card.description}
                    </div>
                    
                    ${this.renderCardCosts(card)}
                </div>
                
                <div class="card-detail-footer">
                    <div class="detail-vp">${vpDisplay}</div>
                    <div class="detail-category">${card.categoryDisplay}</div>
                </div>
            </div>
        `;
    }
    
    renderCardCosts(card) {
        if ((!card.costs || card.costs.length === 0 || (card.costs.length === 1 && Object.keys(card.costs[0]).length === 0)) && 
            !card.costText && !card.fee) {
            return '';
        }
        
        let costsHTML = '<div class="detail-costs">';
        
        // 显示费用文本
        if (card.costText) {
            costsHTML += `<div class="cost-text">费用: ${card.costText}</div>`;
        }
        
        // 显示具体资源费用
        if (card.costs && card.costs.length > 0) {
            card.costs.forEach(cost => {
                if (Object.keys(cost).length > 0) {
                    costsHTML += '<div class="costs-group">';
                    Object.entries(cost).forEach(([resource, amount]) => {
                        costsHTML += `
                            <div class="cost-item">
                                <div class="meeple-container">
                                    <div class="agricola-meeple meeple-${resource.toLowerCase()}"></div>
                                </div>
                                <span>${amount}</span>
                            </div>
                        `;
                    });
                    costsHTML += '</div>';
                }
            });
        }
        
        costsHTML += '</div>';
        return costsHTML;
    }
    
    getDeckName(deck) {
        const deckNames = {
            'A': '基础A套',
            'B': '基础B套',
            'C': '基础C套',
            'D': '基础D套',
            'E': '基础E套',
            'F': '基础F套',
            'G': '基础G套'
        };
        
        return deckNames[deck] || deck;
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