// debug: ensure jQuery loaded
if (typeof jQuery === 'undefined') {
  console.error('delivery.js: jQuery is NOT loaded - handlers will not run');
} else {
  console.log('delivery.js loaded — jQuery version', jQuery.fn.jquery);
}
$(function() {

  // Toast
  function showToast(message, duration) {
    duration = duration || 3000;
    $('.temp-toast').remove();
    var $toast = $('<div/>', { 'class': 'temp-toast', text: message }).appendTo('body');
    // force reflow then show
    window.requestAnimationFrame(function(){ $toast.addClass('show'); });
    setTimeout(function(){
      $toast.removeClass('show');
      setTimeout(function(){ $toast.remove(); }, 400);
    }, duration);
  }

  // Validation
  function validateForm() {
    var rules = [
      { id: 'street',     test: function(v){ return v.length >= 3; }, msg: 'Enter a valid street (min 3 chars).' },
      { id: 'entrance',   test: function(v){ return v.length > 0; },  msg: 'Entrance is required.' },
      { id: 'intercom',   test: function(v){ return v.length > 0; },  msg: 'Intercom is required.' },
      { id: 'floor',      test: function(v){ return /^\d+$/.test(v); }, msg: 'Floor must be a number.' },
      { id: 'apartment',  test: function(v){ return /^\d+$/.test(v); }, msg: 'Apartment must be a number.' }
    ];

    var allValid = true;
    $.each(rules, function(_, rule){
      var $el = $('#' + rule.id);
      if (!$el.length) return;
      var value = ($el.val() || '').trim();
      var ok = rule.test(value);

      var $feedback = $el.parent().find('.invalid-feedback');
      if (!$feedback.length) {
        $feedback = $('<div/>', { 'class': 'invalid-feedback' }).appendTo($el.parent());
      }

      if (!ok) {
        $el.addClass('is-invalid').removeClass('is-valid');
        $feedback.text(rule.msg);
        allValid = false;
      } else {
        $el.removeClass('is-invalid').addClass('is-valid');
        $feedback.text('');
      }
    });

    return allValid;
  }

  // Submit handler
  $(document).on('click', '#submit-delivery', function(e){
    e.preventDefault();
    var $btn = $(this);
    if (!validateForm()) {
      var $first = $('.is-invalid').first();
      if ($first.length) $first.focus();
      return;
    }

    $btn.prop('disabled', true);
    $btn.data('originalHtml', $btn.html());
    $btn.html('<span class="spinner" aria-hidden="true"></span> Please wait...');
    $btn.addClass('loading');

    setTimeout(function(){
      $btn.prop('disabled', false);
      $btn.html($btn.data('originalHtml'));
      $btn.removeClass('loading');
      showToast('Form submitted successfully');
    }, 2000);
  });

  // Reset handler
  $(document).on('click', '#reset-delivery', function(){
    $('input').val('');
    $('.is-invalid, .is-valid').removeClass('is-invalid is-valid');
    $('.invalid-feedback').text('');
  });

  // Copy address button (locations page)
  $(document).on('click', '#copy-address-btn', function(){
    var $btn = $(this);
    var text = $.trim($('#location-street').text() || '');
    if (!text) return;

    // prefer Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){
        $btn.addClass('copied');
        var $tip = $btn.parent().find('.copy-tooltip');
        if ($tip.length) $tip.addClass('show');
        $btn.attr('aria-label','Copied');
        setTimeout(function(){
          $btn.removeClass('copied');
          if ($tip.length) $tip.removeClass('show');
          $btn.attr('aria-label','Copy address');
        }, 1600);
      }).catch(function(err){
        console.error('Clipboard API failed:', err);
      });
      return;
    }

    // fallback: temporary textarea + jQuery .on('copy')
    var $ta = $('<textarea/>').val(text).css({ position: 'fixed', left: '-9999px' }).appendTo('body');
    $ta.on('copy', function(e){
      var ev = e.originalEvent || e;
      if (ev.clipboardData) {
        ev.clipboardData.setData('text/plain', text);
        ev.preventDefault();
      } else if (window.clipboardData) {
        window.clipboardData.setData('Text', text);
        ev.preventDefault();
      }
    });
    $ta.select();
    try {
      document.execCommand('copy');
      $btn.addClass('copied');
      var $tip2 = $btn.parent().find('.copy-tooltip');
      if ($tip2.length) $tip2.addClass('show');
      $btn.attr('aria-label','Copied');
      setTimeout(function(){
        $btn.removeClass('copied');
        if ($tip2.length) $tip2.removeClass('show');
        $btn.attr('aria-label','Copy address');
      }, 1600);
    } catch (err) {
      console.error('execCommand copy failed:', err);
    }
    $ta.remove();
  });

// --- Отправка данных на сервер + Telegram ---
$(document).on('click', '#submit-delivery', async function () {
  if (!validateForm || !validateForm()) {
    console.warn("Form validation failed");
    return;
  }

  const orderData = {
    street: $('#street').val(),
    entrance: $('#entrance').val(),
    intercom: $('#intercom').val(),
    floor: $('#floor').val(),
    apartment: $('#apartment').val(),
    comment: $('#comment').val(),
    cart: JSON.parse(localStorage.getItem('cart')) || []
  };

  try {
    const response = await fetch('/submit_order', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(orderData)
    });

    if (!response.ok) throw new Error('Server error');
    const result = await response.json();
    showToast('✅ Order sent successfully!', 3000);
    console.log('Server response:', result);

    // Очистить корзину после отправки
    localStorage.removeItem('cart');
    loadCart();
  } catch (err) {
    console.error('Ошибка при отправке заказа:', err);
    showToast('❌ Failed to send order!', 3000);
  }
});



function loadCart() {
      const cartList = $('#cart-items');
      const totalElement = $('#cart-total');
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      let total = 0;
      cartList.empty();

      cart.forEach(item => {
        cartList.append(`<li>${item.title} — ${item.price} тг</li>`);
        total += item.price;
      });

      totalElement.text(total.toLocaleString());
  }

  $('#clear-cart').click(function(){
      localStorage.removeItem('cart');
      loadCart();
  });

  $('#submit-delivery').click(function(){
      const orderData = {
        street: $('#street').val(),
        entrance: $('#entrance').val(),
        intercom: $('#intercom').val(),
        floor: $('#floor').val(),
        apartment: $('#apartment').val(),
        comment: $('#comment').val(),
        cart: JSON.parse(localStorage.getItem('cart')) || []
      };

      $.ajax({
          url: 'http://127.0.0.1:5000/submit_order',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(orderData),
          success: function(res){
              alert(res.message);
              localStorage.removeItem('cart');
              loadCart();
          },
          error: function(err){
              console.error(err);
              alert('Ошибка при отправке заказа');
          }
      });
  });

  loadCart();
});
(function () {
  const API_URL = 'https://official-joke-api.appspot.com/random_joke';
  const fetchBtn = document.getElementById('fetch-joke-btn');
  const clearBtn = document.getElementById('clear-joke-btn');
  const setupEl = document.getElementById('joke-setup');
  const punchEl = document.getElementById('joke-punchline');
  const errorEl = document.getElementById('joke-error');

  if (!fetchBtn) return; // widget not present on every page

  async function fetchJoke() {
    try {
      errorEl.style.display = 'none';
      fetchBtn.disabled = true;
      fetchBtn.textContent = 'Loading…';
      setupEl.textContent = '';
      punchEl.textContent = '';

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Network response was not OK');

      const data = await res.json();
      // expected: { id, type, setup, punchline }
      setupEl.textContent = data.setup || '';
      punchEl.textContent = data.punchline || '';
    } catch (err) {
      setupEl.textContent = 'Could not load joke.';
      punchEl.textContent = '';
      errorEl.textContent = err.message || 'Error fetching joke';
      errorEl.style.display = 'block';
      console.error('fetchJoke error:', err);
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Get random joke';
    }
  }

  fetchBtn.addEventListener('click', fetchJoke);
  clearBtn.addEventListener('click', function () {
    setupEl.textContent = 'Want a joke?';
    punchEl.textContent = '';
    errorEl.style.display = 'none';
  });

  // Optional: fetch one joke when the widget is visible
  // fetchJoke();
})();