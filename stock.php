<?

	$action = $_POST['action'] ?? '';

	if($action=='update_stock') {
		$stock = $_POST['stock'] ?? '';
		$stock = json_decode($stock);
		if(!empty($stock)) {
			file_put_contents('stock.json', json_encode($stock));
		}
	}

	$stock = json_decode(file_get_contents('stock.json'));
	//	var_dump($stock, json_last_error_msg());

	$id_cat  = 0;
	$id_prod = 0;
	foreach($stock as &$category) {
		$category->id = ++$id_cat;
		foreach($category->items as &$item) {
			$item->id = ++$id_prod;
			unset($item);
		}
		$ok = usort($category->items, fn ($a, $b) => $a->name <=> $b->name);
		unset($category);
	}

	file_put_contents('stock.json', json_encode($stock, JSON_PRETTY_PRINT));

	header('Content-Type: text/json');
	die(json_encode($stock));