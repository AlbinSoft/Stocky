import { h, render } from "preact";
import { signal } from "@preact/signals";
import { html } from "htm/preact";
import { useEffect, useState } from 'preact/hooks';


const elm_app = document.querySelector('.app');

const stock = signal([]);

fetch('stock.php').then(resp => resp.json()).then(data => {
	stock.value = data;
});


function App(props) {

	const EMPTY_CAT  = { id: 0, name: '', items: [] };
	const EMPTY_PROD = { cid: 0, id: 0, name: '', min: 0, stock: 0 };

	const [ cat,  setCat  ] = useState(null);
	const [ prod, setProd ] = useState(null);

	const stock_dec = (item_id) => {
		const newvalue = [...stock.value];
		newvalue.map(cat => {
			cat.items.map(item => {
				if(item.id==item_id && item.stock>=0) item.stock--;
			});
		});
		stock.value = newvalue;
	};

	const stock_inc = (item_id) => {
		const newvalue = [...stock.value];
		newvalue.map(cat => {
			cat.items.map(item => {
				if(item.id==item_id && item.stock<=9) item.stock++;
			});
		});
		stock.value = newvalue;
	};

	const edit_cat = (cat) => {
		setCat({...cat});
	};

	const edit_prod = (item, cat) => {
	//	if(cat) item.cid = stock.value.findIndex((c) => c.category==cat.category);
		setProd({...item});
	};

	const edit_cat_set = (evt) => {
		evt.preventDefault();
		const newvalue = [...stock.value];
		if(cat.id===0) {
			newvalue.push(cat);
		} else {
			newvalue.map((itm, idx, cats) => {
				if(itm.id===cat.id) cats[idx] = cat;
			});
		}
		stock.value = newvalue;
		setCat(null);
	};

	const edit_prod_set = (evt) => {
		evt.preventDefault();
		const newvalue = [...stock.value];
		if(prod.id===0) {
			newvalue[prod.cat].items.push(prod);
		} else {
			newvalue.map(cat => {
				cat.items.forEach((itm, idx, itms) => {
					if(itm.id==prod.id) itms[idx] = prod;
				});
			});
		}
		stock.value = newvalue;
		setProd(null);
	};

	const edit_cat_rem = (evt) => {
		evt.preventDefault();
		if(confirm('¿Estás seguro/a?')) {
			let newvalue = [...stock.value];
			newvalue.map((itm, idx, itms) => {
				if(itm.id==cat.id) delete itms[idx];
			});
			newvalue = newvalue.filter(i => i!==undefined);
			stock.value = newvalue;
			setCat(null);
		}
	};

	const edit_prod_rem = (evt) => {
		evt.preventDefault();
		if(confirm('¿Estás seguro/a?')) {
			const newvalue = [...stock.value];
			newvalue.map(cat => {
				cat.items.forEach((itm, idx, itms) => {
					if(itm.id==prod.id) delete itms[idx];
				});
				cat.items = cat.items.filter(i => i!==undefined);
			});
			stock.value = newvalue;
			setProd(null);
		}
	};

	const edit_cat_cls = (evt) => {
		evt.preventDefault();
		setCat(null);
	};

	const edit_prod_cls = (evt) => {
		evt.preventDefault();
		setProd(null);
	};

	const get_categories = () => {
		const temp = [...stock.value];
		const opts = [];
		temp.map((cat, idx) => console.log(cat) );
		temp.map((cat, idx) => opts.push( { value: idx, label: cat.category } ));
		console.log(opts)
		return opts;
	};

	useEffect(() => {
		if(stock.value && stock.value.length) {
			// TODO debounce it
			const sent  = JSON.stringify(stock.value);
			const fdata = new FormData();
			fdata.append('action', 'update_stock');
			fdata.append('stock',  sent);
			fetch('stock.php', { method: 'POST', body: fdata }).then(resp => resp.json()).then(data => {
				console.log(data);
				const got = JSON.stringify(data);
				if(sent!==got && got!==null) stock.value = data;
			});
		}
	}, [stock.value]);

	return html`
		<div class="panel">
			${ stock.value.length===0 ? html`<p class="loading">Cargando stock&hellip;</p>` : '' }
			${ stock.value.length!==0 ? html`<ul class="cats_list">
				${ stock.value.map(cat => {
					return html`<li class="cat_wrap">
						<span class="cat_name">${cat.category} <span class="action_editcat" onClick=${() => edit_cat(cat)}></span></span>
						<ul class="items_list">
							${ cat.items.length===0 ? html`- vacía -` : '' }
							${ cat.items.map(item => {
								return html`<li class="item_wrap ${item.stock<item.min ? 'alert' : ''}">
									<span class="item_name" onClick=${() => edit_prod(item, cat)}>${item.name}</span>
									<span class="item_dec"  onClick=${() => stock_dec(item.id)}>-</span>
									<span class="item_qty" >${item.stock}</span>
									<span class="item_inc" onClick=${() => stock_inc(item.id)}>+</span>
								</li>`;
							}) }
						</ul>
					</li>`;
				}) }
			</ul>` : '' }
		</div>
		${ cat!==null ? html`<dialog class="config" open>
			<form class="config_frm">
				<span class="config_cls" onClick=${e => edit_cat_cls(e)} dangerouslySetInnerHTML=${{__html: '&times;'}}></span>
				<div class="config_fields">
					<label for="item_name">Categoría</label>
					<input type="text"   id="item_name" value=${cat.category} onChange=${e => setCat({...cat, category: e.target.value})} />
				</div>
				<p class="config_btns">
					${ cat.id!==0 && cat.items.length===0 ? html`<button class="config_rem" onClick=${e => edit_cat_rem(e)}>Eliminar</button>` : '' }
					<button class="config_set" onClick=${e => edit_cat_set(e)}>Guardar</button>
				</p>
			</form>
		</dialog>` : '' }
		${ prod!==null ? html`<dialog class="config" open>
			<form class="config_frm">
				<span class="config_cls" onClick=${e => edit_prod_cls(e)} dangerouslySetInnerHTML=${{__html: '&times;'}}></span>
				<div class="config_fields">
					${ prod.id===0 ? html`
						<label for="item_cat">Categoría</label>
							<select id="item_cat" onChange=${e => setProd({...prod, cat: e.target.value})}>
							${ get_categories().map(opt => {
								return html`<option value=${opt.value}>${opt.label}</option>`;
							} ) }
						</select>
					` : '' }
					<label for="item_name">Producto</label>
					<input type="text"   id="item_name" value=${prod.name} onChange=${e => setProd({...prod, name: e.target.value})} />
					<label for="item_min">Stock mín.</label>
					<input type="number" id="item_min"  value=${prod.min}  onChange=${e => setProd({...prod, min: parseInt(e.target.value, 10) })} min="0" max="9" />
				</div>
				<p class="config_btns">
					${ prod.id!==0 ? html`<button class="config_rem" onClick=${e => edit_prod_rem(e)}>Eliminar</button>` : '' }
					<button class="config_set" onClick=${e => edit_prod_set(e)}>Guardar</button>
				</p>
			</form>
		</dialog>` : '' }
		<aside class="actions">
			<a class="action_addcategory" onClick=${() => edit_cat (EMPTY_CAT)}></a>
			<a class="action_addproduct"  onClick=${() => edit_prod(EMPTY_PROD)}></a>
		</aside>
	`;
}

render(html`<${App} />`, elm_app);
